import { GQLFacebookAuthIntegrationTypeResolver } from "talk-server/graph/tenant/schema/__generated__/types";
import { FacebookAuthIntegration } from "talk-server/models/settings";

const FacebookAuthIntegration: GQLFacebookAuthIntegrationTypeResolver<
  FacebookAuthIntegration
> = {
  config: auth => auth,
};

export default FacebookAuthIntegration;
