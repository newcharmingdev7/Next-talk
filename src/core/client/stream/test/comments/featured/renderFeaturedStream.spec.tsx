import { pureMerge } from "coral-common/utils";
import { GQLResolver, StoryToCommentsResolver } from "coral-framework/schema";
import {
  createQueryResolverStub,
  createResolversStub,
  CreateTestRendererParams,
  waitForElement,
  within,
} from "coral-framework/testHelpers";

import { settings, storyWithFeaturedComments } from "../../fixtures";
import create from "./create";

const story = storyWithFeaturedComments;

async function createTestRenderer(
  params: CreateTestRendererParams<GQLResolver> = {}
) {
  const { testRenderer, context } = create({
    ...params,
    resolvers: pureMerge(
      createResolversStub<GQLResolver>({
        Query: {
          settings: () => settings,
          story: () => ({
            ...story,
            featuredComments: createQueryResolverStub<StoryToCommentsResolver>(
              () => {
                return story.comments;
              }
            ) as any,
          }),
        },
      }),
      params.resolvers
    ),
    initLocalState: (localRecord, source, environment) => {
      localRecord.setValue(story.id, "storyID");
      if (params.initLocalState) {
        params.initLocalState(localRecord, source, environment);
      }
    },
  });
  return {
    testRenderer,
    context,
  };
}

it("renders comment stream", async () => {
  const { testRenderer } = await createTestRenderer();
  await waitForElement(() =>
    within(testRenderer.root).getByTestID("comments-stream-log")
  );
  expect(within(testRenderer.root).toJSON()).toMatchSnapshot();
});
