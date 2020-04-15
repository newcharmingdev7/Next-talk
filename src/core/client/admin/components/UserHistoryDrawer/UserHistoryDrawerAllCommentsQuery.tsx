import { Localized } from "@fluent/react/compat";
import React, { FunctionComponent } from "react";
import { graphql } from "react-relay";

import { QueryRenderer } from "coral-framework/lib/relay";
import { CallOut, Spinner } from "coral-ui/components/v2";

import { UserHistoryDrawerAllCommentsQuery as QueryTypes } from "coral-admin/__generated__/UserHistoryDrawerAllCommentsQuery.graphql";

import UserHistoryDrawerAllComments from "./UserHistoryDrawerAllComments";

import styles from "./UserHistoryDrawerAllCommentsQuery.css";

interface Props {
  userID: string;
}

const UserHistoryDrawerAllCommentsQuery: FunctionComponent<Props> = ({
  userID,
}) => {
  return (
    <QueryRenderer<QueryTypes>
      query={graphql`
        query UserHistoryDrawerAllCommentsQuery($userID: ID!) {
          user(id: $userID) {
            ...UserHistoryDrawerAllComments_user
          }
          settings {
            ...UserHistoryDrawerAllComments_settings
          }
        }
      `}
      variables={{ userID }}
      cacheConfig={{ force: true }}
      render={({ error, props }) => {
        if (!props) {
          return (
            <div className={styles.root}>
              <Spinner />
            </div>
          );
        }

        if (!props.user) {
          return (
            <div className={styles.callout}>
              <CallOut>
                <Localized id="moderate-user-drawer-user-not-found ">
                  User not found.
                </Localized>
              </CallOut>
            </div>
          );
        }

        return (
          <UserHistoryDrawerAllComments
            settings={props.settings}
            user={props.user}
          />
        );
      }}
    />
  );
};

export default UserHistoryDrawerAllCommentsQuery;
