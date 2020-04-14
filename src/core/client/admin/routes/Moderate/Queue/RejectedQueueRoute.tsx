import { Localized } from "@fluent/react/compat";
import { RouteProps } from "found";
import React from "react";
import { graphql, RelayPaginationProp } from "react-relay";

import { IntersectionProvider } from "coral-framework/lib/intersection";
import { withPaginationContainer } from "coral-framework/lib/relay";

import { RejectedQueueRoute_query } from "coral-admin/__generated__/RejectedQueueRoute_query.graphql";
import { RejectedQueueRoutePaginationQueryVariables } from "coral-admin/__generated__/RejectedQueueRoutePaginationQuery.graphql";

import EmptyMessage from "./EmptyMessage";
import LoadingQueue from "./LoadingQueue";
import Queue from "./Queue";

interface RejectedQueueRouteProps {
  query: RejectedQueueRoute_query;
  relay: RelayPaginationProp;
  storyID?: string;
  siteID?: string;
}

// TODO: use generated types
const danglingLogic = (status: string) => ["APPROVED"].includes(status);

export class RejectedQueueRoute extends React.Component<
  RejectedQueueRouteProps
> {
  public static routeConfig: RouteProps;

  public state = {
    disableLoadMore: false,
  };

  public render() {
    const comments = this.props.query.comments.edges.map(edge => edge.node);
    return (
      <IntersectionProvider>
        <Queue
          settings={this.props.query.settings}
          comments={comments}
          onLoadMore={this.loadMore}
          hasLoadMore={this.props.relay.hasMore()}
          disableLoadMore={this.state.disableLoadMore}
          danglingLogic={danglingLogic}
          emptyElement={
            <Localized id="moderate-emptyQueue-rejected">
              <EmptyMessage>There are no rejected comments.</EmptyMessage>
            </Localized>
          }
          allStories={!this.props.storyID}
        />
      </IntersectionProvider>
    );
  }

  private loadMore = () => {
    if (!this.props.relay.hasMore() || this.props.relay.isLoading()) {
      return;
    }
    this.setState({ disableLoadMore: true });
    this.props.relay.loadMore(
      10, // Fetch the next 10 feed items
      error => {
        this.setState({ disableLoadMore: false });
        if (error) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }
    );
  };
}

// TODO: (cvle) If this could be autogenerated..
type FragmentVariables = RejectedQueueRoutePaginationQueryVariables;

const enhanced = (withPaginationContainer<
  RejectedQueueRouteProps,
  RejectedQueueRoutePaginationQueryVariables,
  FragmentVariables
>(
  {
    query: graphql`
      fragment RejectedQueueRoute_query on Query
        @argumentDefinitions(
          count: { type: "Int!", defaultValue: 5 }
          cursor: { type: "Cursor" }
          storyID: { type: "ID" }
          siteID: { type: "ID" }
        ) {
        comments(
          status: REJECTED
          storyID: $storyID
          siteID: $siteID
          first: $count
          after: $cursor
        ) @connection(key: "RejectedQueue_comments") {
          edges {
            node {
              id
              ...ModerateCardContainer_comment
            }
          }
        }
        settings {
          ...ModerateCardContainer_settings
        }
      }
    `,
  },
  {
    direction: "forward",
    getConnectionFromProps(props) {
      return props.query && props.query.comments;
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
    query: graphql`
      # Pagination query to be fetched upon calling 'loadMore'.
      # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
      query RejectedQueueRoutePaginationQuery(
        $storyID: ID
        $siteID: ID
        $count: Int!
        $cursor: Cursor
      ) {
        ...RejectedQueueRoute_query
          @arguments(
            storyID: $storyID
            siteID: $siteID
            count: $count
            cursor: $cursor
          )
      }
    `,
  }
)(RejectedQueueRoute) as any) as typeof RejectedQueueRoute;

enhanced.routeConfig = {
  Component: enhanced,
  query: graphql`
    query RejectedQueueRouteQuery($storyID: ID, $siteID: ID) {
      ...RejectedQueueRoute_query @arguments(storyID: $storyID, siteID: $siteID)
    }
  `,
  cacheConfig: { force: true },
  render: function RejectedRouteRender({ Component, props, match }) {
    if (Component && props) {
      return (
        <Component
          query={props}
          storyID={match.params.storyID}
          siteID={match.params.siteID}
        />
      );
    }
    return <LoadingQueue />;
  },
};

export default enhanced;
