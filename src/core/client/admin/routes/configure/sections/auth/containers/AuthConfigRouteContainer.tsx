import { FormApi } from "final-form";
import React from "react";
import { graphql } from "react-relay";

import { AuthConfigRouteContainerQueryResponse } from "coral-admin/__generated__/AuthConfigRouteContainerQuery.graphql";
import { withRouteConfig } from "coral-framework/lib/router";
import { Delay, Spinner } from "coral-ui/components";

import AuthConfigContainer from "./AuthConfigContainer";

interface Props {
  data: AuthConfigRouteContainerQueryResponse | null;
  form: FormApi;
  submitting?: boolean;
}

class AuthRouteContainer extends React.Component<Props> {
  public render() {
    if (!this.props.data) {
      return (
        <Delay>
          <Spinner />
        </Delay>
      );
    }
    return (
      <AuthConfigContainer
        auth={this.props.data.settings.auth}
        form={this.props.form}
        submitting={this.props.submitting}
      />
    );
  }
}

const enhanced = withRouteConfig<Props>({
  query: graphql`
    query AuthConfigRouteContainerQuery {
      settings {
        auth {
          ...AuthConfigContainer_auth
        }
      }
    }
  `,
  cacheConfig: { force: true },
})(AuthRouteContainer);

export default enhanced;
