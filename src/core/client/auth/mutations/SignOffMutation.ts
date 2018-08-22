import { commitLocalUpdate, Environment } from "relay-runtime";
import { TalkContext } from "talk-framework/lib/bootstrap";
import { createMutationContainer } from "talk-framework/lib/relay";
import { LOCAL_ID } from "talk-framework/lib/relay/withLocalStateContainer";

export type SignOffMutation = () => Promise<void>;

export async function commit(
  environment: Environment,
  { localStorage }: TalkContext
) {
  return commitLocalUpdate(environment, store => {
    const record = store.get(LOCAL_ID)!;
    record.setValue("", "authToken");
    localStorage.removeItem("authToken");

    // Force gc to trigger.
    environment
      .retain({
        dataID: "tmp",
        node: { selections: [] },
        variables: {},
      })
      .dispose();
  });
}

export const withSignOffMutation = createMutationContainer("signOff", commit);
