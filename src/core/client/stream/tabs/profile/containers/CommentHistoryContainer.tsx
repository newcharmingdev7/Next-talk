import React from "react";
import { graphql, RelayPaginationProp } from "react-relay";

import { withPaginationContainer } from "talk-framework/lib/relay";
import { CommentHistoryContainer_me as MeData } from "talk-stream/__generated__/CommentHistoryContainer_me.graphql";
import { CommentHistoryContainer_story as StoryData } from "talk-stream/__generated__/CommentHistoryContainer_story.graphql";
import { CommentHistoryContainerPaginationQueryVariables } from "talk-stream/__generated__/CommentHistoryContainerPaginationQuery.graphql";

import CommentHistory from "../components/CommentHistory";

interface CommentHistoryContainerProps {
  me: MeData;
  story: StoryData;
  relay: RelayPaginationProp;
}

export class CommentHistoryContainer extends React.Component<
  CommentHistoryContainerProps
> {
  public state = {
    disableLoadMore: false,
  };

  public render() {
    const comments = this.props.me.comments.edges.map(edge => edge.node);
    return (
      <CommentHistory
        story={this.props.story}
        comments={comments}
        onLoadMore={this.loadMore}
        hasMore={this.props.relay.hasMore()}
        disableLoadMore={this.state.disableLoadMore}
      />
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
          // tslint:disable-next-line:no-console
          console.error(error);
        }
      }
    );
  };
}

// TODO: (cvle) This should be autogenerated.
interface FragmentVariables {
  count: number;
  cursor?: string;
}

const enhanced = withPaginationContainer<
  CommentHistoryContainerProps,
  CommentHistoryContainerPaginationQueryVariables,
  FragmentVariables
>(
  {
    story: graphql`
      fragment CommentHistoryContainer_story on Story {
        ...HistoryCommentContainer_story
      }
    `,
    me: graphql`
      fragment CommentHistoryContainer_me on User
        @argumentDefinitions(
          count: { type: "Int!", defaultValue: 5 }
          cursor: { type: "Cursor" }
        ) {
        comments(first: $count, after: $cursor)
          @connection(key: "CommentHistory_comments") {
          edges {
            node {
              id
              ...HistoryCommentContainer_comment
            }
          }
        }
      }
    `,
  },
  {
    direction: "forward",
    getConnectionFromProps(props) {
      return props.me && props.me.comments;
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
      };
    },
    query: graphql`
      # Pagination query to be fetched upon calling 'loadMore'.
      # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
      query CommentHistoryContainerPaginationQuery(
        $count: Int!
        $cursor: Cursor
      ) {
        me {
          ...CommentHistoryContainer_me
            @arguments(count: $count, cursor: $cursor)
        }
      }
    `,
  }
)(CommentHistoryContainer);

export default enhanced;
