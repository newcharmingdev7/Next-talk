import { Localized } from "fluent-react/compat";
import React, { StatelessComponent } from "react";

import { Button, Flex, Typography } from "talk-ui/components";

import MatchMedia from "talk-ui/components/MatchMedia";
import * as styles from "./UserBoxAuthenticated.css";

export interface UserBoxAuthenticatedProps {
  onSignOut: () => void;
  username: string;
}

const UserBoxAuthenticated: StatelessComponent<
  UserBoxAuthenticatedProps
> = props => {
  return (
    <Flex itemGutter="half">
      <Flex itemGutter="half" className={styles.child}>
        <MatchMedia gteWidth="sm">
          <Localized id="comments-userBoxAuthenticated-signedInAs">
            <Typography variant="bodyCopy" component="span">
              Signed in as
            </Typography>
          </Localized>
          <Typography variant="bodyCopyBold" component="span">
            {props.username}
          </Typography>
        </MatchMedia>
      </Flex>
      <Flex itemGutter="half" className={styles.child}>
        <Localized id="comments-userBoxAuthenticated-notYou">
          <Typography variant="bodyCopy" component="span">
            Not you?
          </Typography>
        </Localized>
        <Localized id="comments-userBoxAuthenticated-signOut">
          <Button
            color="primary"
            size="small"
            variant="underlined"
            onClick={props.onSignOut}
          >
            Sign Out
          </Button>
        </Localized>
      </Flex>
    </Flex>
  );
};

export default UserBoxAuthenticated;
