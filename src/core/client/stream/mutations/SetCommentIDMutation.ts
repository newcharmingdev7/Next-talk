import { commitLocalUpdate, Environment } from "relay-runtime";
import { createMutationContainer } from "talk-framework/lib/relay";
import { LOCAL_ID } from "talk-framework/lib/relay/withLocalStateContainer";

export interface SetCommentIDInput {
  id: string | null;
}

export type SetCommentIDMutation = (input: SetCommentIDInput) => Promise<void>;

async function commit(environment: Environment, input: SetCommentIDInput) {
  return commitLocalUpdate(environment, store => {
    const record = store.get(LOCAL_ID)!;
    record.setValue(input.id, "commentID");
  });
}

export const withSetCommentIDMutation = createMutationContainer(
  "setCommentID",
  commit
);
