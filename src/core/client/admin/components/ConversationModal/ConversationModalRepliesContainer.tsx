import { Localized } from "@fluent/react/compat";
import React, {
  FunctionComponent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { graphql, RelayPaginationProp } from "react-relay";

import {
  useLoadMore,
  withPaginationContainer,
} from "coral-framework/lib/relay";
import { Button, HorizontalGutter } from "coral-ui/components/v2";

import { ConversationModalRepliesContainer_comment } from "coral-admin/__generated__/ConversationModalRepliesContainer_comment.graphql";
import { ConversationModalRepliesContainer_settings } from "coral-admin/__generated__/ConversationModalRepliesContainer_settings.graphql";
import { ConversationModalRepliesContainerPaginationQueryVariables } from "coral-admin/__generated__/ConversationModalRepliesContainerPaginationQuery.graphql";

import ConversationModalCommentContainer from "./ConversationModalCommentContainer";

import styles from "./ConversationModalRepliesContainer.css";

interface Props {
  relay: RelayPaginationProp;
  comment: ConversationModalRepliesContainer_comment;
  settings: ConversationModalRepliesContainer_settings;
  onClose: () => void;
  onUsernameClicked: (id?: string) => void;
}

const ConversationModalRepliesContainer: FunctionComponent<Props> = ({
  comment,
  relay,
  settings,
  onUsernameClicked,
}) => {
  const [loadMore] = useLoadMore(relay, 5);
  const replies = useMemo(
    () => comment.replies.edges.map((edge) => edge.node, comment.replies),
    [comment.replies]
  );
  const [showReplies, setShowReplies] = useState(false);
  const onShowReplies = useCallback(() => {
    setShowReplies(true);
  }, []);
  return (
    <HorizontalGutter>
      {showReplies &&
        replies.map((reply) => (
          <div key={reply.id} className={styles.comment}>
            <ConversationModalCommentContainer
              key={reply.id}
              settings={settings}
              comment={reply}
              isHighlighted={false}
              isReply={true}
              onUsernameClick={onUsernameClicked}
            />
          </div>
        ))}
      <div className={styles.footer}>
        {!showReplies && comment.replyCount > 0 && (
          <Localized id="conversation-modal-replies-show">
            <Button variant="outline" fullWidth onClick={onShowReplies}>
              Show replies
            </Button>
          </Localized>
        )}
        {showReplies &&
          comment.replyCount > replies.length &&
          replies.length > 0 && (
            <Localized id="conversation-modal-replies-show-more">
              <Button variant="outline" fullWidth onClick={loadMore}>
                Show more replies
              </Button>
            </Localized>
          )}
      </div>
    </HorizontalGutter>
  );
};

// TODO: (cvle) If this could be autogenerated.
type FragmentVariables = Omit<
  ConversationModalRepliesContainerPaginationQueryVariables,
  "commentID"
>;

const enhanced = withPaginationContainer<
  Props,
  ConversationModalRepliesContainerPaginationQueryVariables,
  FragmentVariables
>(
  {
    settings: graphql`
      fragment ConversationModalRepliesContainer_settings on Settings {
        ...ConversationModalCommentContainer_settings
      }
    `,
    comment: graphql`
      fragment ConversationModalRepliesContainer_comment on Comment
        @argumentDefinitions(
          count: { type: "Int!", defaultValue: 5 }
          cursor: { type: "Cursor" }
          orderBy: { type: "COMMENT_SORT!", defaultValue: CREATED_AT_ASC }
        ) {
        id
        replies(first: $count, after: $cursor, orderBy: $orderBy)
          @connection(key: "ConversationModalReplies_replies") {
          edges {
            node {
              id
              ...ConversationModalCommentContainer_comment
            }
          }
        }
        replyCount
      }
    `,
  },
  {
    direction: "forward",
    getConnectionFromProps(props) {
      return props.comment && props.comment.replies;
    },
    // This is also the default implementation of `getFragmentVariables` if it isn't provided.
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        count,
        cursor,
        orderBy: fragmentVariables.orderBy,
        commentID: props.comment.id,
      };
    },
    query: graphql`
      # Pagination query to be fetched upon calling 'loadMore'.
      # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
      query ConversationModalRepliesContainerPaginationQuery(
        $count: Int!
        $cursor: Cursor
        $orderBy: COMMENT_SORT!
        $commentID: ID!
      ) {
        comment(id: $commentID) {
          ...ConversationModalRepliesContainer_comment
            @arguments(count: $count, cursor: $cursor, orderBy: $orderBy)
        }
      }
    `,
  }
)(ConversationModalRepliesContainer);

export default enhanced;
