import React from "react";
import { graphql } from "react-relay";

import { withFragmentContainer } from "talk-framework/lib/relay";
import { ProfileContainer_me as MeData } from "talk-stream/__generated__/ProfileContainer_me.graphql";

import Profile from "../components/Profile";

interface ProfileContainerProps {
  me: MeData | null;
}

export class StreamContainer extends React.Component<ProfileContainerProps> {
  public render() {
    return <Profile me={this.props.me} />;
  }
}
const enhanced = withFragmentContainer<ProfileContainerProps>({
  me: graphql`
    fragment ProfileContainer_me on User {
      ...UserBoxContainer_me
    }
  `,
})(StreamContainer);

export default enhanced;
