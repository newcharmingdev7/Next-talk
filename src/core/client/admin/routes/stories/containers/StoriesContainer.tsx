import { FormApi } from "final-form";
import React, { FunctionComponent } from "react";
import { graphql } from "react-relay";

import { StoriesContainerQueryResponse } from "coral-admin/__generated__/StoriesContainerQuery.graphql";
import { withRouteConfig } from "coral-framework/lib/router";

import Stories from "../components/Stories";

interface Props {
  data: StoriesContainerQueryResponse | null;
  form: FormApi;
  initialSearchFilter?: string;
}

const StoriesContainer: FunctionComponent<Props> = props => {
  return (
    <Stories
      query={props.data}
      initialSearchFilter={props.initialSearchFilter}
    />
  );
};

const enhanced = withRouteConfig<Props>({
  query: graphql`
    query StoriesContainerQuery($searchFilter: String) {
      ...StoryTableContainer_query @arguments(searchFilter: $searchFilter)
    }
  `,
  cacheConfig: { force: true },
  prepareVariables: (params, match) => {
    return {
      searchFilter: match.location.query.q,
    };
  },
  render: ({ match, Component, ...rest }) => (
    <Component initialSearchFilter={match.location.query.q} {...rest} />
  ),
})(StoriesContainer);

export default enhanced;
