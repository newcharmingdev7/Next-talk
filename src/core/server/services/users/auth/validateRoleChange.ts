import { GQLUSER_ROLE } from "coral-server/graph/schema/__generated__/types";
import { User } from "coral-server/models/user";

const { ADMIN, MODERATOR } = GQLUSER_ROLE;

const validateModeratorRoleChange = (
  viewer: Readonly<User>,
  user: Readonly<User>,
  role: GQLUSER_ROLE
) => {
  if (role === GQLUSER_ROLE.ADMIN && viewer.role !== GQLUSER_ROLE.ADMIN) {
    return false;
  }
  // Org mods may promote users to site moderators within their scope,
  // but only if the user < org mod
  const viewerIsOrgMod = !viewer.moderationScopes?.siteIDs?.length;
  const userIsSiteMod = !!user.moderationScopes?.siteIDs?.length;
  const userIsNotMod = user.role !== MODERATOR;
  if (viewerIsOrgMod && (userIsSiteMod || userIsNotMod)) {
    return true;
  }

  return false;
};

export const validateRoleChange = (
  viewer: Readonly<User>,
  user: Readonly<User>,
  role: GQLUSER_ROLE
): boolean => {
  // User is admin
  if (user.role === ADMIN) {
    return false;
  }

  // Viewer is changing their own role
  if (user.id === viewer.id) {
    return false;
  }

  // User is admin
  if (viewer.role === ADMIN) {
    return true;
  }

  // User is org/site moderator
  if (viewer.role === MODERATOR) {
    return validateModeratorRoleChange(viewer, user, role);
  }

  // No one else may update users roles
  return false;
};
