import React, { StatelessComponent, useCallback, useState } from "react";
import { graphql, RelayPaginationProp } from "react-relay";

import { StoryTableContainer_query as QueryData } from "talk-admin/__generated__/StoryTableContainer_query.graphql";
import { StoryTableContainerPaginationQueryVariables } from "talk-admin/__generated__/StoryTableContainerPaginationQuery.graphql";
import { IntersectionProvider } from "talk-framework/lib/intersection";
import { withPaginationContainer } from "talk-framework/lib/relay";
import { GQLSTORY_STATUS_RL } from "talk-framework/schema";

import { HorizontalGutter } from "talk-ui/components";
import StoryTable from "../components/StoryTable";
import StoryTableFilter from "../components/StoryTableFilter";

interface Props {
  query: QueryData | null;
  relay: RelayPaginationProp;
}

const StoryTableContainer: StatelessComponent<Props> = props => {
  const stories = props.query
    ? props.query.stories.edges.map(edge => edge.node)
    : [];
  const [disableLoadMore, setDisableLoadMore] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<GQLSTORY_STATUS_RL | null>(
    null
  );

  const setStatusFilterAndRefetch = useCallback(
    (status: GQLSTORY_STATUS_RL | null) => {
      setStatusFilter(status);
      setRefetching(true);
      props.relay.refetchConnection(
        10,
        error => {
          setRefetching(false);
          if (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
          }
        },
        {
          statusFilter: status,
        }
      );
    },
    [statusFilter, props.relay]
  );

  const loadMore = useCallback(
    () => {
      if (!props.relay.hasMore() || props.relay.isLoading()) {
        return;
      }
      setDisableLoadMore(true);
      props.relay.loadMore(
        10, // Fetch the next 10 feed items
        error => {
          setDisableLoadMore(false);
          if (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
          }
        }
      );
    },
    [props.relay]
  );

  return (
    <IntersectionProvider>
      <HorizontalGutter size="double">
        <StoryTableFilter
          onSetStatusFilter={status =>
            setStatusFilterAndRefetch(status || null)
          }
          statusFilter={statusFilter}
        />
        <StoryTable
          viewer={props.query && props.query.viewer}
          loading={!props.query || refetching}
          stories={stories}
          onLoadMore={loadMore}
          hasMore={!refetching && props.relay.hasMore()}
          disableLoadMore={disableLoadMore}
          isSearching={Boolean(statusFilter)}
        />
      </HorizontalGutter>
    </IntersectionProvider>
  );
};

// TODO: (cvle) This should be autogenerated.
interface FragmentVariables {
  count: number;
  cursor?: string;
  statusFilter: GQLSTORY_STATUS_RL | null;
}

const enhanced = withPaginationContainer<
  Props,
  StoryTableContainerPaginationQueryVariables,
  FragmentVariables
>(
  {
    query: graphql`
      fragment StoryTableContainer_query on Query
        @argumentDefinitions(
          count: { type: "Int!", defaultValue: 10 }
          cursor: { type: "Cursor" }
          statusFilter: { type: "STORY_STATUS" }
        ) {
        viewer {
          ...StoryRowContainer_viewer
        }
        stories(first: $count, after: $cursor, status: $statusFilter)
          @connection(key: "StoryTable_stories") {
          edges {
            node {
              id
              ...StoryRowContainer_story
            }
          }
        }
      }
    `,
  },
  {
    direction: "forward",
    getConnectionFromProps(props) {
      return props.query && props.query.stories;
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
        statusFilter: fragmentVariables.statusFilter,
      };
    },
    query: graphql`
      # Pagination query to be fetched upon calling 'loadMore'.
      # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
      query StoryTableContainerPaginationQuery(
        $count: Int!
        $cursor: Cursor
        $statusFilter: STORY_STATUS
      ) {
        ...StoryTableContainer_query
          @arguments(
            count: $count
            cursor: $cursor
            statusFilter: $statusFilter
          )
      }
    `,
  }
)(StoryTableContainer);

export default enhanced;
