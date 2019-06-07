import {
  GQLResolver,
  QueryToModerationQueuesResolver,
} from "coral-framework/schema";
import {
  act,
  createAccessToken,
  createQueryResolverStub,
  createResolversStub,
  CreateTestRendererParams,
  replaceHistoryLocation,
  wait,
} from "coral-framework/testHelpers";

import { pureMerge } from "coral-common/utils";
import create from "../create";
import {
  emptyModerationQueues,
  emptyRejectedComments,
  settings,
  users,
} from "../fixtures";

const viewer = users.admins[0];

async function createTestRenderer(
  params: CreateTestRendererParams<GQLResolver> = {}
) {
  replaceHistoryLocation("http://localhost/admin/login");
  const { testRenderer, context } = create({
    ...params,
    resolvers: pureMerge(
      createResolversStub<GQLResolver>({
        Query: {
          settings: () => settings,
          moderationQueues: createQueryResolverStub<
            QueryToModerationQueuesResolver
          >(() => emptyModerationQueues),
          comments: () => emptyRejectedComments,
          viewer: () => viewer,
        },
      }),
      params.resolvers
    ),
    initLocalState: (localRecord, source, environment) => {
      localRecord.setValue(true, "loggedIn");
      localRecord.setValue(createAccessToken(), "accessToken");
      localRecord.setValue("SIGN_IN", "authView");
      if (params.initLocalState) {
        params.initLocalState(localRecord, source, environment);
      }
    },
  });
  return { testRenderer, context };
}

it("redirect when already logged in", async () => {
  await createTestRenderer();
  await act(async () => {
    await wait(() =>
      expect(window.location.toString()).toBe(
        "http://localhost/admin/moderate/reported"
      )
    );
  });
});

it("redirect to redirectPath when already logged in", async () => {
  await createTestRenderer({
    initLocalState: localRecord => {
      localRecord.setValue("/admin/moderate/pending", "redirectPath");
    },
  });
  await act(async () => {
    await wait(() =>
      expect(window.location.toString()).toBe(
        "http://localhost/admin/moderate/pending"
      )
    );
  });
});
