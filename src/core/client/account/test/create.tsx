import React from "react";

import App from "coral-account/App";
import { GQLResolver } from "coral-framework/schema";
import {
  createTestRenderer,
  CreateTestRendererParams,
} from "coral-framework/testHelpers";

export default function create(
  params: CreateTestRendererParams<GQLResolver> = {}
) {
  return createTestRenderer<GQLResolver>("account", <App />, params);
}
