import { commitLocalUpdate, Environment } from "relay-runtime";

import { REDIRECT_PATH_KEY } from "talk-admin/constants";
import { getParamsFromHashAndClearIt } from "talk-framework/helpers";
import { TalkContext } from "talk-framework/lib/bootstrap";
import { initLocalBaseState, LOCAL_ID } from "talk-framework/lib/relay";

/**
 * Initializes the local state, before we start the App.
 */
export default async function initLocalState(
  environment: Environment,
  context: TalkContext
) {
  const { error = null, accessToken } = getParamsFromHashAndClearIt();
  let redirectPath: string | null = null;
  if (error || accessToken) {
    // Keep redirect path as we are in the middle of an auth flow.
    redirectPath =
      (await context.localStorage.getItem(REDIRECT_PATH_KEY)) || null;
  } else {
    // Remove redirect path from local storage as we start a new auth flow.
    await context.localStorage.setItem(REDIRECT_PATH_KEY, "");
  }

  await initLocalBaseState(environment, context, accessToken);

  commitLocalUpdate(environment, s => {
    const localRecord = s.get(LOCAL_ID)!;

    localRecord.setValue(redirectPath, "redirectPath");
    localRecord.setValue("SIGN_IN", "authView");
    localRecord.setValue(error, "authError");
  });
}
