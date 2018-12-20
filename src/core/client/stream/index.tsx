import { Child as PymChild } from "pym.js";
import React from "react";
import { StatelessComponent } from "react";
import ReactDOM from "react-dom";

import { createManaged } from "talk-framework/lib/bootstrap";
import AppContainer from "talk-stream/containers/AppContainer";

import {
  OnEvents,
  OnPostMessageSetAuthToken,
  OnPymLogin,
  OnPymLogout,
  OnPymSetCommentID,
} from "./listeners";
import { initLocalState } from "./local";
import localesData from "./locales";

const listeners = (
  <>
    <OnPymLogin />
    <OnPymLogout />
    <OnPymSetCommentID />
    <OnPostMessageSetAuthToken />
    <OnEvents />
  </>
);

async function main() {
  const ManagedTalkContextProvider = await createManaged({
    initLocalState,
    localesData,
    userLocales: navigator.languages,
    pym: new PymChild({ polling: 100 }),
  });

  const Index: StatelessComponent = () => (
    <ManagedTalkContextProvider>
      <>
        {listeners}
        <AppContainer />
      </>
    </ManagedTalkContextProvider>
  );

  ReactDOM.render(<Index />, document.getElementById("app"));
}

main();
