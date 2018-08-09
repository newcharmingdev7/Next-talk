import * as React from "react";
import { StatelessComponent } from "react";

import SignInContainer from "../containers/SignInContainer";
import SignUpContainer from "../containers/SignUpContainer";

export interface AppProps {
  // TODO: (cvle) Remove %future added value when we have Relay 1.6
  // https://github.com/facebook/relay/commit/1e87e43add7667a494f7ff4cfa7f03f1ab8d81a2
  view: "SIGN_UP" | "SIGN_IN" | "FORGOT_PASSWORD" | "%future added value";
}

const App: StatelessComponent<AppProps> = ({ view }) => {
  switch (view) {
    case "SIGN_UP":
      return <SignUpContainer />;
    case "SIGN_IN":
      return <SignInContainer />;
    default:
      return <SignInContainer />;
  }
};

export default App;
