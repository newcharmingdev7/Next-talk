import React, { Component } from "react";
import { BadUserInputError } from "talk-framework/lib/errors";
import SignUp, { SignUpForm } from "../components/SignUp";

import {
  SetViewMutation,
  SignUpMutation,
  withSetViewMutation,
  withSignUpMutation,
} from "../mutations";

interface SignUpContainerProps {
  signUp: SignUpMutation;
  setView: SetViewMutation;
}

interface SignUpContainerState {
  error: string | null;
}

export type View = "SIGN_IN";

class SignUpContainer extends Component<
  SignUpContainerProps,
  SignUpContainerState
> {
  public state = { error: "" };
  private setView = (view: View) => {
    this.props.setView({
      view,
    });
  };
  private onSubmit: SignUpForm["onSubmit"] = async (input, form) => {
    try {
      await this.props.signUp(input);
      form.reset();
    } catch (error) {
      this.setState({ error: error.message });
      if (error instanceof BadUserInputError) {
        return error.invalidArgsLocalized;
      }
      // tslint:disable-next-line:no-console
      console.error(error);
    }
    return undefined;
  };
  private goToSignIn = () => this.setView("SIGN_IN");
  public render() {
    return (
      <SignUp
        onSubmit={this.onSubmit}
        goToSignIn={this.goToSignIn}
        error={this.state.error}
      />
    );
  }
}

const enhanced = withSetViewMutation(withSignUpMutation(SignUpContainer));
export default enhanced;
