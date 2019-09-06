import { pureMerge } from "coral-common/utils";
import { GQLResolver } from "coral-framework/schema";
import {
  createResolversStub,
  CreateTestRendererParams,
  replaceHistoryLocation,
  wait,
  waitForElement,
  within,
} from "coral-framework/testHelpers";

import create from "../create";
import { settings, users } from "../fixtures";

beforeEach(() => {
  replaceHistoryLocation("http://localhost/admin/configure/advanced");
});

const viewer = users.admins[0];

async function createTestRenderer(
  params: CreateTestRendererParams<GQLResolver> = {}
) {
  const { testRenderer, context } = create({
    ...params,
    resolvers: pureMerge(
      createResolversStub<GQLResolver>({
        Query: {
          settings: () => settings,
          viewer: () => viewer,
        },
      }),
      params.resolvers
    ),
    initLocalState: (localRecord, source, environment) => {
      if (params.initLocalState) {
        params.initLocalState(localRecord, source, environment);
      }
    },
  });

  const configureContainer = await waitForElement(() =>
    within(testRenderer.root).getByTestID("configure-container")
  );
  const advancedContainer = await waitForElement(() =>
    within(configureContainer).getByTestID("configure-advancedContainer")
  );
  const saveChangesButton = within(configureContainer).getByTestID(
    "configure-sideBar-saveChanges"
  );
  return {
    context,
    testRenderer,
    configureContainer,
    advancedContainer,
    saveChangesButton,
  };
}

it("renders configure advanced", async () => {
  const { configureContainer } = await createTestRenderer();
  expect(within(configureContainer).toJSON()).toMatchSnapshot();
});

it("change custom css", async () => {
  const resolvers = createResolversStub<GQLResolver>({
    Mutation: {
      updateSettings: ({ variables }) => {
        expectAndFail(variables.settings.customCSSURL).toEqual("./custom.css");
        return {
          settings: pureMerge(settings, variables.settings),
        };
      },
    },
  });
  const {
    configureContainer,
    advancedContainer,
    saveChangesButton,
  } = await createTestRenderer({
    resolvers,
  });

  const customCSSField = within(advancedContainer).getByLabelText("Custom CSS");

  // Let's change the customCSS field.
  customCSSField.props.onChange("./custom.css");

  // Send form
  within(configureContainer)
    .getByType("form")
    .props.onSubmit();

  // Submit button and text field should be disabled.
  expect(saveChangesButton.props.disabled).toBe(true);
  expect(customCSSField.props.disabled).toBe(true);

  // Wait for submission to be finished
  await wait(() => {
    expect(customCSSField.props.disabled).toBe(false);
  });

  // Should have successfully sent with server.
  expect(resolvers.Mutation!.updateSettings!.called).toBe(true);
});

it("remove custom css", async () => {
  const resolvers = createResolversStub<GQLResolver>({
    Query: {
      settings: () =>
        pureMerge<typeof settings>(settings, {
          customCSSURL: "./custom.css",
        }),
    },
    Mutation: {
      updateSettings: ({ variables }) => {
        expectAndFail(variables.settings.customCSSURL).toBeNull();
        return {
          settings: pureMerge(settings, variables.settings),
        };
      },
    },
  });
  const { configureContainer, advancedContainer } = await createTestRenderer({
    resolvers,
  });

  const customCSSField = within(advancedContainer).getByLabelText("Custom CSS");

  // Let's change the customCSS field.
  customCSSField.props.onChange("");

  // Send form
  within(configureContainer)
    .getByType("form")
    .props.onSubmit();

  // Wait for submission to be finished
  await wait(() => {
    expect(resolvers.Mutation!.updateSettings!.called).toBe(true);
  });
});

it("renders with live configuration when configurable", async () => {
  const { advancedContainer } = await createTestRenderer();

  expect(
    within(advancedContainer).queryByLabelText("Comment Stream Live Updates")
  ).toBeDefined();
});

it("renders without live configuration when not configurable", async () => {
  const resolvers = createResolversStub<GQLResolver>({
    Query: {
      settings: () =>
        pureMerge<typeof settings>(settings, {
          live: { configurable: false },
        }),
    },
  });
  const { advancedContainer } = await createTestRenderer({
    resolvers,
  });

  expect(
    within(advancedContainer).queryByLabelText("Comment Stream Live Updates")
  ).toEqual(null);
});

it("change permitted domains to be empty", async () => {
  const resolvers = createResolversStub<GQLResolver>({
    Mutation: {
      updateSettings: ({ variables }) => {
        expectAndFail(variables.settings.allowedDomains).toEqual([]);
        return {
          settings: pureMerge(settings, variables.settings),
        };
      },
    },
  });
  const {
    configureContainer,
    advancedContainer,
    saveChangesButton,
  } = await createTestRenderer({
    resolvers,
  });

  const permittedDomainsField = within(advancedContainer).getByLabelText(
    "Permitted domains"
  );

  // Let's change the permitted domains.
  permittedDomainsField.props.onChange("");

  // Send form
  within(configureContainer)
    .getByType("form")
    .props.onSubmit();

  // Submit button and text field should be disabled.
  expect(saveChangesButton.props.disabled).toBe(true);
  expect(permittedDomainsField.props.disabled).toBe(true);

  // Wait for submission to be finished
  await wait(() => {
    expect(permittedDomainsField.props.disabled).toBe(false);
  });

  // Should have successfully sent with server.
  expect(resolvers.Mutation!.updateSettings!.called).toBe(true);
});

it("change permitted domains to include more domains", async () => {
  const resolvers = createResolversStub<GQLResolver>({
    Mutation: {
      updateSettings: ({ variables }) => {
        expectAndFail(variables.settings.allowedDomains).toEqual([
          "http://localhost:8080",
          "http://localhost:3000",
        ]);
        return {
          settings: pureMerge(settings, variables.settings),
        };
      },
    },
  });
  const {
    configureContainer,
    advancedContainer,
    saveChangesButton,
  } = await createTestRenderer({
    resolvers,
  });

  const permittedDomainsField = within(advancedContainer).getByLabelText(
    "Permitted domains"
  );

  // Let's change the permitted domains.
  permittedDomainsField.props.onChange(
    "http://localhost:8080, http://localhost:3000"
  );

  // Send form
  within(configureContainer)
    .getByType("form")
    .props.onSubmit();

  // Submit button and text field should be disabled.
  expect(saveChangesButton.props.disabled).toBe(true);
  expect(permittedDomainsField.props.disabled).toBe(true);

  // Wait for submission to be finished
  await wait(() => {
    expect(permittedDomainsField.props.disabled).toBe(false);
  });

  // Should have successfully sent with server.
  expect(resolvers.Mutation!.updateSettings!.called).toBe(true);
});
