import { Localized } from "@fluent/react/compat";
import React, { FunctionComponent, useCallback, useEffect } from "react";
import { graphql, GraphQLTaggedNode, RelayPaginationProp } from "react-relay";

import { IntersectionProvider } from "coral-framework/lib/intersection";
import {
  combineDisposables,
  useLoadMore,
  useMutation,
  useSubscription,
  withPaginationContainer,
} from "coral-framework/lib/relay";
import { withRouteConfig } from "coral-framework/lib/router";
import { GQLMODERATION_QUEUE } from "coral-framework/schema";

import { QueueRoute_queue } from "coral-admin/__generated__/QueueRoute_queue.graphql";
import { QueueRoute_settings } from "coral-admin/__generated__/QueueRoute_settings.graphql";
import { QueueRoutePaginationPendingQueryVariables } from "coral-admin/__generated__/QueueRoutePaginationPendingQuery.graphql";

import EmptyMessage from "./EmptyMessage";
import LoadingQueue from "./LoadingQueue";
import Queue from "./Queue";
import QueueCommentEnteredSubscription from "./QueueCommentEnteredSubscription";
import QueueCommentLeftSubscription from "./QueueCommentLeftSubscription";
import QueueViewNewMutation from "./QueueViewNewMutation";

interface Props {
  isLoading: boolean;
  queueName: GQLMODERATION_QUEUE;
  queue: QueueRoute_queue | null;
  settings: QueueRoute_settings | null;
  relay: RelayPaginationProp;
  emptyElement: React.ReactElement;
  storyID?: string;
  siteID?: string;
  count?: string;
}

// TODO: use generated types
const danglingLogic = (status: string) =>
  ["APPROVED", "REJECTED"].includes(status);

export const QueueRoute: FunctionComponent<Props> = props => {
  const [loadMore, isLoadingMore] = useLoadMore(props.relay, 10);
  const subscribeToQueueCommentEntered = useSubscription(
    QueueCommentEnteredSubscription
  );
  const subscribeToQueueCommentLeft = useSubscription(
    QueueCommentLeftSubscription
  );
  const viewNew = useMutation(QueueViewNewMutation);
  const onViewNew = useCallback(() => {
    viewNew({
      queue: props.queueName,
      storyID: props.storyID || null,
      siteID: props.siteID || null,
    });
  }, [props.queueName, props.storyID, props.siteID, viewNew]);
  useEffect(() => {
    const vars = {
      queue: props.queueName,
      storyID: props.storyID || null,
      siteID: props.siteID || null,
    };
    const disposable = combineDisposables(
      subscribeToQueueCommentEntered(vars),
      subscribeToQueueCommentLeft(vars)
    );
    return () => {
      disposable.dispose();
    };
  }, [
    props.storyID,
    props.siteID,
    props.queueName,
    subscribeToQueueCommentEntered,
    subscribeToQueueCommentLeft,
  ]);
  if (props.isLoading) {
    return <LoadingQueue />;
  }
  const comments = props.queue!.comments.edges.map(edge => edge.node);
  const viewNewCount =
    (props.queue!.comments.viewNewEdges &&
      props.queue!.comments.viewNewEdges.length) ||
    0;
  return (
    <IntersectionProvider>
      <Queue
        comments={comments}
        settings={props.settings!}
        onLoadMore={loadMore}
        hasLoadMore={props.relay.hasMore()}
        disableLoadMore={isLoadingMore}
        danglingLogic={danglingLogic}
        emptyElement={props.emptyElement}
        allStories={!props.storyID}
        viewNewCount={viewNewCount}
        onViewNew={onViewNew}
      />
    </IntersectionProvider>
  );
};

// TODO: (cvle) If this could be autogenerated..
type FragmentVariables = QueueRoutePaginationPendingQueryVariables;

const createQueueRoute = (
  queueName: GQLMODERATION_QUEUE,
  queueQuery: GraphQLTaggedNode,
  paginationQuery: GraphQLTaggedNode,
  emptyElement: React.ReactElement
) => {
  const enhanced = withRouteConfig<Props, any>({
    query: queueQuery,
    cacheConfig: { force: true },
    render: function QueueRouteRender({ Component, data, match }) {
      if (!Component) {
        throw new Error("Missing component");
      }
      if (!data || !data.moderationQueues) {
        return (
          <Component
            isLoading
            queueName={queueName}
            queue={null}
            settings={null}
            emptyElement={emptyElement}
            storyID={match.params.storyID}
            siteID={match.params.siteID}
          />
        );
      }
      const queue =
        data.moderationQueues[Object.keys(data.moderationQueues)[0]];
      return (
        <Component
          isLoading={false}
          queueName={queueName}
          queue={queue}
          settings={data.settings}
          emptyElement={emptyElement}
          storyID={match.params.storyID}
          siteID={match.params.siteID}
        />
      );
    },
  })(
    withPaginationContainer<
      Props,
      QueueRoutePaginationPendingQueryVariables,
      FragmentVariables
    >(
      {
        queue: graphql`
          fragment QueueRoute_queue on ModerationQueue
            @argumentDefinitions(
              count: { type: "Int!", defaultValue: 5 }
              cursor: { type: "Cursor" }
            ) {
            count
            comments(first: $count, after: $cursor)
              @connection(key: "Queue_comments") {
              viewNewEdges {
                cursor
              }
              edges {
                node {
                  id
                  ...ModerateCardContainer_comment
                }
              }
            }
          }
        `,
        settings: graphql`
          fragment QueueRoute_settings on Settings {
            ...ModerateCardContainer_settings
          }
        `,
      },
      {
        direction: "forward",
        getConnectionFromProps(props) {
          return props.queue && props.queue.comments;
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
            ...fragmentVariables,
            count,
            cursor,
          };
        },
        query: paginationQuery,
      }
    )(QueueRoute)
  );

  return enhanced;
};

export const PendingQueueRoute = createQueueRoute(
  GQLMODERATION_QUEUE.PENDING,
  graphql`
    query QueueRoutePendingQuery($storyID: ID, $siteID: ID, $count: Int) {
      moderationQueues(storyID: $storyID, siteID: $siteID) {
        pending {
          ...QueueRoute_queue @arguments(count: $count)
        }
      }
      settings {
        ...QueueRoute_settings
      }
    }
  `,
  graphql`
    # Pagination query to be fetched upon calling 'loadMore'.
    # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
    query QueueRoutePaginationPendingQuery(
      $storyID: ID
      $siteID: ID
      $count: Int!
      $cursor: Cursor
    ) {
      moderationQueues(storyID: $storyID, siteID: $siteID) {
        pending {
          ...QueueRoute_queue @arguments(count: $count, cursor: $cursor)
        }
      }
    }
  `,
  // eslint-disable-next-line:jsx-wrap-multiline
  <Localized id="moderate-emptyQueue-pending">
    <EmptyMessage>
      Nicely done! There are no more pending comments to moderate.
    </EmptyMessage>
  </Localized>
);

export const ReportedQueueRoute = createQueueRoute(
  GQLMODERATION_QUEUE.REPORTED,
  graphql`
    query QueueRouteReportedQuery($storyID: ID, $siteID: ID) {
      moderationQueues(storyID: $storyID, siteID: $siteID) {
        reported {
          ...QueueRoute_queue
        }
      }
      settings {
        ...QueueRoute_settings
      }
    }
  `,
  graphql`
    # Pagination query to be fetched upon calling 'loadMore'.
    # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
    query QueueRoutePaginationReportedQuery(
      $storyID: ID
      $siteID: ID
      $count: Int!
      $cursor: Cursor
    ) {
      moderationQueues(storyID: $storyID, siteID: $siteID) {
        reported {
          ...QueueRoute_queue @arguments(count: $count, cursor: $cursor)
        }
      }
    }
  `,
  // eslint-disable-next-line:jsx-wrap-multiline
  <Localized id="moderate-emptyQueue-reported">
    <EmptyMessage>
      Nicely done! There are no more reported comments to moderate.
    </EmptyMessage>
  </Localized>
);

export const UnmoderatedQueueRoute = createQueueRoute(
  GQLMODERATION_QUEUE.UNMODERATED,
  graphql`
    query QueueRouteUnmoderatedQuery($storyID: ID, $siteID: ID) {
      moderationQueues(storyID: $storyID, siteID: $siteID) {
        unmoderated {
          ...QueueRoute_queue
        }
      }
      settings {
        ...QueueRoute_settings
      }
    }
  `,
  graphql`
    # Pagination query to be fetched upon calling 'loadMore'.
    # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
    query QueueRoutePaginationUnmoderatedQuery(
      $storyID: ID
      $siteID: ID
      $count: Int!
      $cursor: Cursor
    ) {
      moderationQueues(storyID: $storyID, siteID: $siteID) {
        unmoderated {
          ...QueueRoute_queue @arguments(count: $count, cursor: $cursor)
        }
      }
    }
  `,
  // eslint-disable-next-line:jsx-wrap-multiline
  <Localized id="moderate-emptyQueue-unmoderated">
    <EmptyMessage>Nicely done! All comments have been moderated.</EmptyMessage>
  </Localized>
);
