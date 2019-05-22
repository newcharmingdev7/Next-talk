import React, { ChangeEvent } from "react";
import { graphql, RelayPaginationProp } from "react-relay";

import { withPaginationContainer } from "coral-framework/lib/relay";
import { Omit, PropTypesOf } from "coral-framework/types";
import { StreamContainer_settings as SettingsData } from "coral-stream/__generated__/StreamContainer_settings.graphql";
import { StreamContainer_story as StoryData } from "coral-stream/__generated__/StreamContainer_story.graphql";
import { StreamContainer_viewer as ViewerData } from "coral-stream/__generated__/StreamContainer_viewer.graphql";
import {
  COMMENT_SORT,
  StreamContainerPaginationQueryVariables,
} from "coral-stream/__generated__/StreamContainerPaginationQuery.graphql";
import StoryClosedTimeoutContainer from "coral-stream/containers/StoryClosedTimeoutContainer";

import Stream from "../components/Stream";

interface Props {
  story: StoryData;
  settings: SettingsData;
  viewer: ViewerData | null;
  relay: RelayPaginationProp;
  defaultOrderBy: COMMENT_SORT;
}

// tslint:disable-next-line:no-unused-expression
graphql`
  fragment StreamContainer_comment on Comment {
    id
    ...CommentContainer_comment
    ...ReplyListContainer1_comment
  }
`;

export class StreamContainer extends React.Component<Props> {
  public state = {
    disableLoadMore: false,
    refetching: false,
  };
  private orderBy = this.props.defaultOrderBy;

  private handleOnChangeOrderBy = (e: ChangeEvent<HTMLSelectElement>) => {
    this.orderBy = e.target.value as COMMENT_SORT;
    this.setState({ refetching: true });
    this.props.relay.refetchConnection(
      5,
      err => {
        if (err) {
          // tslint:disable-next-line:no-console
          console.error(err);
          return;
        }
        this.setState({ refetching: false });
      },
      {
        orderBy: e.target.value as COMMENT_SORT,
      }
    );
  };

  public render() {
    const comments = this.props.story.comments.edges.map(edge => edge.node);
    return (
      <>
        <StoryClosedTimeoutContainer story={this.props.story} />
        <Stream
          story={this.props.story}
          comments={comments}
          settings={this.props.settings}
          onLoadMore={this.loadMore}
          hasMore={this.props.relay.hasMore()}
          disableLoadMore={this.state.disableLoadMore}
          viewer={this.props.viewer}
          orderBy={this.orderBy}
          onChangeOrderBy={this.handleOnChangeOrderBy}
          refetching={this.state.refetching}
        />
      </>
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

// TODO: (cvle) if this could be autogenerated..
type FragmentVariables = Omit<
  StreamContainerPaginationQueryVariables,
  "storyID"
>;

const enhanced = withPaginationContainer<
  Props,
  StreamContainerPaginationQueryVariables,
  FragmentVariables
>(
  {
    story: graphql`
      fragment StreamContainer_story on Story
        @argumentDefinitions(
          count: { type: "Int!", defaultValue: 5 }
          cursor: { type: "Cursor" }
          orderBy: { type: "COMMENT_SORT!", defaultValue: CREATED_AT_DESC }
        ) {
        id
        isClosed
        comments(first: $count, after: $cursor, orderBy: $orderBy)
          @connection(key: "Stream_comments") {
          edges {
            node {
              ...StreamContainer_comment @relay(mask: false)
            }
          }
        }
        ...PostCommentFormContainer_story
        ...CommentContainer_story
        ...ReplyListContainer1_story
        ...StoryClosedTimeoutContainer_story
        ...CreateCommentReplyMutation_story
        ...CreateCommentMutation_story
      }
    `,
    viewer: graphql`
      fragment StreamContainer_viewer on User {
        ...ReplyListContainer1_viewer
        ...CommentContainer_viewer
        ...UserBoxContainer_viewer
        ...CreateCommentReplyMutation_viewer
        ...CreateCommentMutation_viewer
      }
    `,
    settings: graphql`
      fragment StreamContainer_settings on Settings {
        reaction {
          sortLabel
        }
        ...PostCommentFormContainer_settings
        ...ReplyListContainer1_settings
        ...CommentContainer_settings
        ...UserBoxContainer_settings
        ...CommunityGuidelinesContainer_settings
      }
    `,
  },
  {
    direction: "forward",
    getConnectionFromProps(props) {
      return props.story && props.story.comments;
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
        // storyID isn't specified as an @argument for the fragment, but it should be a
        // variable available for the fragment under the query root.
        storyID: props.story.id,
      };
    },
    query: graphql`
      # Pagination query to be fetched upon calling 'loadMore'.
      # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
      query StreamContainerPaginationQuery(
        $count: Int!
        $cursor: Cursor
        $orderBy: COMMENT_SORT!
        $storyID: ID
      ) {
        story(id: $storyID) {
          ...StreamContainer_story
            @arguments(count: $count, cursor: $cursor, orderBy: $orderBy)
        }
      }
    `,
  }
)(StreamContainer);

export type StreamContainerProps = PropTypesOf<typeof enhanced>;
export default enhanced;
