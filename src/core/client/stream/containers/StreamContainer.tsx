import React from "react";
import { graphql, RelayPaginationProp } from "react-relay";

import { withPaginationContainer } from "talk-framework/lib/relay";
import { PropTypesOf } from "talk-framework/types";
import { StreamContainer_asset as AssetData } from "talk-stream/__generated__/StreamContainer_asset.graphql";
import { StreamContainer_user as UserData } from "talk-stream/__generated__/StreamContainer_user.graphql";
import {
  COMMENT_SORT,
  StreamContainerPaginationQueryVariables,
} from "talk-stream/__generated__/StreamContainerPaginationQuery.graphql";

import Stream from "../components/Stream";

interface InnerProps {
  asset: AssetData;
  user: UserData | null;
  relay: RelayPaginationProp;
}

export class StreamContainer extends React.Component<InnerProps> {
  public state = {
    disableLoadMore: false,
  };

  public render() {
    const comments = this.props.asset.comments.edges.map(edge => edge.node);
    return (
      <Stream
        assetID={this.props.asset.id}
        isClosed={this.props.asset.isClosed}
        comments={comments}
        onLoadMore={this.loadMore}
        hasMore={this.props.relay.hasMore()}
        disableLoadMore={this.state.disableLoadMore}
        user={this.props.user}
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
  orderBy: COMMENT_SORT;
}

const enhanced = withPaginationContainer<
  InnerProps,
  StreamContainerPaginationQueryVariables,
  FragmentVariables
>(
  {
    asset: graphql`
      fragment StreamContainer_asset on Asset
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
              id
              ...CommentContainer
              ...ReplyListContainer_comment
            }
          }
        }
      }
    `,
    user: graphql`
      fragment StreamContainer_user on User {
        ...UserBoxContainer_user
      }
    `,
  },
  {
    direction: "forward",
    getConnectionFromProps(props) {
      return props.asset && props.asset.comments;
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
        // assetID isn't specified as an @argument for the fragment, but it should be a
        // variable available for the fragment under the query root.
        assetID: props.asset.id,
      };
    },
    query: graphql`
      # Pagination query to be fetched upon calling 'loadMore'.
      # Notice that we re-use our fragment, and the shape of this query matches our fragment spec.
      query StreamContainerPaginationQuery(
        $count: Int!
        $cursor: Cursor
        $orderBy: COMMENT_SORT!
        $assetID: ID!
      ) {
        asset(id: $assetID) {
          ...StreamContainer_asset
            @arguments(count: $count, cursor: $cursor, orderBy: $orderBy)
        }
      }
    `,
  }
)(StreamContainer);

export type StreamContainerProps = PropTypesOf<typeof enhanced>;
export default enhanced;
