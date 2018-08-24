import { Child as PymChild } from "pym.js";
import React from "react";
import { StatelessComponent } from "react";
import ReactDOM from "react-dom";

import {
  createContext,
  TalkContext,
  TalkContextProvider,
} from "talk-framework/lib/bootstrap";

import AppContainer from "./containers/AppContainer";
import {
  onPostMessageAuthError,
  onPostMessageSetAuthToken,
  onPymSetCommentID,
} from "./listeners";
import { initLocalState } from "./local";
import localesData from "./locales";

const listeners = [
  onPymSetCommentID,
  onPostMessageSetAuthToken,
  onPostMessageAuthError,
];

// This is called when the context is first initialized.
async function init(context: TalkContext) {
  await initLocalState(context.relayEnvironment, context);
  listeners.forEach(f => f(context));
}

async function main() {
  // Bootstrap our context.
  const context = await createContext({
    init,
    localesData,
    userLocales: navigator.languages,
    pym: new PymChild({ polling: 100 }),
  });

  const Index: StatelessComponent = () => (
    <TalkContextProvider value={context}>
      <AppContainer />
    </TalkContextProvider>
  );

  ReactDOM.render(<Index />, document.getElementById("app"));
}

main();
