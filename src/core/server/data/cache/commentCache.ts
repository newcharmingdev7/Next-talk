import { MongoContext } from "coral-server/data/context";
import { Comment } from "coral-server/models/comment";
import { PUBLISHED_STATUSES } from "coral-server/models/comment/constants";
import { AugmentedRedis } from "coral-server/services/redis";
import zlib from "zlib";

import {
  GQLCOMMENT_SORT,
  GQLCOMMENT_STATUS,
  GQLTAG,
} from "coral-server/graph/schema/__generated__/types";

export const COMMENT_CACHE_DATA_EXPIRY = 24 * 60 * 60;

export interface Filter {
  tag?: GQLTAG;
  rating?: number;
  statuses?: GQLCOMMENT_STATUS[];
}

export class CommentCache {
  private mongo: MongoContext;
  private redis: AugmentedRedis;

  private commentsByKey: Map<string, Readonly<Comment>>;
  private membersLookup: Map<string, string[]>;

  constructor(mongo: MongoContext, redis: AugmentedRedis) {
    this.mongo = mongo;
    this.redis = redis;

    this.commentsByKey = new Map<string, Readonly<Comment>>();
    this.membersLookup = new Map<string, string[]>();
  }

  private computeDataKey(tenantID: string, storyID: string, commentID: string) {
    const key = `${tenantID}:${storyID}:${commentID}:data`;
    return key;
  }

  private computeMembersKey(
    tenantID: string,
    storyID: string,
    parentID?: string | null
  ) {
    const key = parentID
      ? `${tenantID}:${storyID}:${parentID}`
      : `${tenantID}:${storyID}:root`;
    return key;
  }

  private async createCommentKeysInRedis(
    tenantID: string,
    storyID: string,
    comments: Readonly<Comment>[]
  ) {
    const cmd = this.redis.multi();

    const commentIDs = new Map<string, string[]>();
    for (const comment of comments) {
      const parentID = comment.parentID ? comment.parentID : "root";

      if (!commentIDs.has(parentID)) {
        commentIDs.set(parentID, []);
      }

      commentIDs.get(parentID)!.push(comment.id);

      const key = this.computeDataKey(tenantID, storyID, comment.id);
      const value = this.serializeObject(comment);

      cmd.set(key, value);
      cmd.expire(key, COMMENT_CACHE_DATA_EXPIRY);
    }

    for (const parentID of commentIDs.keys()) {
      const childIDs = commentIDs.get(parentID);
      if (!childIDs) {
        continue;
      }

      const key = this.computeMembersKey(tenantID, storyID, parentID);
      cmd.sadd(key, ...childIDs);
      cmd.expire(key, COMMENT_CACHE_DATA_EXPIRY);
    }

    await cmd.exec();
  }

  private async populateRootComments(
    tenantID: string,
    storyID: string,
    isArchived: boolean
  ): Promise<string[]> {
    const collection =
      isArchived && this.mongo.archive
        ? this.mongo.archivedComments()
        : this.mongo.comments();

    const comments = await collection.find({ tenantID, storyID }).toArray();
    if (!comments || comments.length === 0) {
      return [];
    }

    await this.createCommentKeysInRedis(tenantID, storyID, comments);

    return comments.map((c) => c.id);
  }

  private async populateReplies(
    tenantID: string,
    storyID: string,
    parentID: string,
    isArchived: boolean
  ) {
    const collection =
      isArchived && this.mongo.archive
        ? this.mongo.archivedComments()
        : this.mongo.comments();

    const comments = await collection
      .find({ tenantID, storyID, parentID })
      .toArray();
    if (!comments || comments.length === 0) {
      return [];
    }

    await this.createCommentKeysInRedis(tenantID, storyID, comments);

    return comments.map((c) => c.id);
  }

  public async find(
    tenantID: string,
    storyID: string,
    id: string
  ): Promise<Readonly<Comment> | null> {
    const key = this.computeDataKey(tenantID, storyID, id);

    const localComment = this.commentsByKey.get(key);
    if (localComment) {
      return localComment;
    }

    const record = await this.redis.get(key);
    if (!record) {
      return null;
    }

    const comment = this.deserializeObject(record);
    this.commentsByKey.set(key, comment);

    return comment;
  }

  public async findMany(tenantID: string, storyID: string, ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const results: Readonly<Comment>[] = [];
    const keys = ids.map((id) => this.computeDataKey(tenantID, storyID, id));

    const notFound: string[] = [];
    for (const key of keys) {
      const localComment = this.commentsByKey.get(key);
      if (localComment) {
        results.push(localComment);
      } else {
        notFound.push(key);
      }
    }

    if (notFound.length > 0) {
      const records = await this.redis.mget(...notFound);
      for (const record of records) {
        if (!record) {
          continue;
        }

        const comment = this.deserializeObject(record);

        this.commentsByKey.set(
          this.computeDataKey(comment.tenantID, comment.storyID, comment.id),
          comment
        );
        results.push(comment);
      }
    }

    const ordered: Readonly<Comment>[] = [];
    for (const id of ids) {
      const comment = results.find((c) => c.id === id);
      if (comment) {
        ordered.push(comment);
      }
    }

    return ordered;
  }

  public async findAncestors(tenantID: string, storyID: string, id: string) {
    const comment = await this.find(tenantID, storyID, id);
    if (!comment) {
      return [];
    }

    return this.findMany(tenantID, storyID, comment.ancestorIDs);
  }

  public async rootComments(
    tenantID: string,
    storyID: string,
    isArchived: boolean,
    orderBy: GQLCOMMENT_SORT = GQLCOMMENT_SORT.CREATED_AT_DESC
  ) {
    const membersKey = this.computeMembersKey(tenantID, storyID);

    let rootCommentIDs = this.membersLookup.get(membersKey);
    if (!rootCommentIDs) {
      rootCommentIDs = await this.redis.smembers(membersKey);

      if (!rootCommentIDs || rootCommentIDs.length === 0) {
        rootCommentIDs = await this.populateRootComments(
          tenantID,
          storyID,
          isArchived
        );
      }

      this.membersLookup.set(membersKey, rootCommentIDs);
    }

    if (rootCommentIDs.length === 0) {
      return this.createConnection([]);
    }

    const comments = await this.findMany(tenantID, storyID, rootCommentIDs);
    const sortedComments = this.sortComments(comments, orderBy);

    return this.createConnection(sortedComments);
  }

  public async flattenedReplies(
    tenantID: string,
    storyID: string,
    parentID: string,
    isArchived: boolean,
    orderBy: GQLCOMMENT_SORT = GQLCOMMENT_SORT.CREATED_AT_ASC
  ) {
    const comments = await this.flattenRepliesRecursive(
      tenantID,
      storyID,
      parentID,
      isArchived
    );
    const sortedComments = this.sortComments(comments, orderBy);

    return this.createConnection(sortedComments);
  }

  private async flattenRepliesRecursive(
    tenantID: string,
    storyID: string,
    parentID: string,
    isArchived: boolean
  ) {
    const result: Readonly<Comment>[] = [];

    const replies = await this.retrieveReplies(
      tenantID,
      storyID,
      parentID,
      isArchived
    );
    for (const reply of replies) {
      result.push(reply);

      if (reply.childCount > 0) {
        const childrenOfReplies = await this.flattenRepliesRecursive(
          tenantID,
          storyID,
          reply.id,
          isArchived
        );
        for (const child of childrenOfReplies) {
          result.push(child);
        }
      }
    }

    return result;
  }

  public async replies(
    tenantID: string,
    storyID: string,
    parentID: string,
    isArchived: boolean,
    orderBy: GQLCOMMENT_SORT = GQLCOMMENT_SORT.CREATED_AT_ASC
  ) {
    const comments = await this.retrieveReplies(
      tenantID,
      storyID,
      parentID,
      isArchived
    );
    const sortedComments = this.sortComments(comments, orderBy);

    return this.createConnection(sortedComments);
  }

  private async retrieveReplies(
    tenantID: string,
    storyID: string,
    parentID: string,
    isArchived: boolean
  ) {
    const parent = await this.find(tenantID, storyID, parentID);
    if (!parent || parent.childCount === 0) {
      return [];
    }

    const membersKey = this.computeMembersKey(tenantID, storyID, parentID);
    let commentIDs = this.membersLookup.get(membersKey);
    if (!commentIDs) {
      commentIDs = await this.redis.smembers(membersKey);
      if (!commentIDs || commentIDs.length === 0) {
        commentIDs = await this.populateReplies(
          tenantID,
          storyID,
          parentID,
          isArchived
        );
      }

      this.membersLookup.set(membersKey, commentIDs);
    }

    if (commentIDs.length === 0) {
      return [];
    }

    const comments = await this.findMany(tenantID, storyID, commentIDs);

    return comments;
  }

  public async update(comment: Readonly<Comment>) {
    if (!PUBLISHED_STATUSES.includes(comment.status)) {
      return;
    }
    const cmd = this.redis.multi();

    const dataKey = this.computeDataKey(
      comment.tenantID,
      comment.storyID,
      comment.id
    );
    cmd.set(dataKey, this.serializeObject(comment));
    cmd.expire(dataKey, COMMENT_CACHE_DATA_EXPIRY);

    const parentKey = this.computeMembersKey(
      comment.tenantID,
      comment.storyID,
      comment.parentID
    );
    cmd.sadd(parentKey, comment.id);
    cmd.expire(parentKey, COMMENT_CACHE_DATA_EXPIRY);

    await cmd.exec();

    this.commentsByKey.set(dataKey, comment);

    if (!this.membersLookup.has(parentKey)) {
      this.membersLookup.set(parentKey, []);
    }
    this.membersLookup.get(parentKey)!.push(comment.id);
  }

  private createConnection(comments: Readonly<Comment>[]) {
    const edges: any[] = [];
    const nodes: any[] = [];

    for (const comment of comments) {
      nodes.push(comment);
      edges.push({
        cursor: comment.createdAt,
        node: comment,
      });
    }

    return {
      edges,
      nodes,
      pageInfo: {
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        startCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  private sortComments(
    comments: Readonly<Comment>[],
    orderBy: GQLCOMMENT_SORT
  ) {
    return comments.sort((a, b) => {
      if (orderBy === GQLCOMMENT_SORT.CREATED_AT_ASC) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      if (orderBy === GQLCOMMENT_SORT.CREATED_AT_DESC) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (orderBy === GQLCOMMENT_SORT.REPLIES_DESC) {
        return b.childCount - a.childCount;
      }
      if (orderBy === GQLCOMMENT_SORT.REACTION_DESC) {
        const aCount = a.actionCounts.REACTION ?? 0;
        const bCount = b.actionCounts.REACTION ?? 0;

        return bCount - aCount;
      }

      return 0;
    });
  }

  private serializeObject(comment: Readonly<Comment>) {
    const json = JSON.stringify(comment);
    const data = zlib.brotliCompressSync(json).toString("base64");

    return data;
  }

  private deserializeObject(data: string): Readonly<Comment> {
    const buffer = Buffer.from(data, "base64");
    const json = zlib.brotliDecompressSync(buffer).toString();
    const parsed = JSON.parse(json);

    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
    };
  }
}
