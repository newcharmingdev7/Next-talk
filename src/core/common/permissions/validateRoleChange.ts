import { isSiteModerationScoped } from "./isSiteModerationScoped";
import {
  isLTEModerator,
  isModerator,
  LTEModerator,
  Moderator,
  User,
  UserRole,
} from "./types";

const validateModeratorRoleChange = (
  viewer: Readonly<Moderator>,
  user: Readonly<LTEModerator>,
  role: UserRole,
  scoped: boolean
) => {
  // Org mods may promote users to site moderators within their scope,
  // but only if the user < org mod
  const viewerIsOrgMod = !isSiteModerationScoped(viewer.moderationScopes);
  const roleIsSiteMod = role === "MODERATOR" && scoped;
  const userLTOrgMod =
    isSiteModerationScoped(user.moderationScopes) || user.role !== "MODERATOR";

  if (viewerIsOrgMod && userLTOrgMod && roleIsSiteMod) {
    log("org mods may promote < org mods to site mods, TRUE");
    return true;
  }

  log(JSON.stringify({ viewerRole: viewer.role, scoped, role, roleIsSiteMod }));

  if (roleIsSiteMod) {
    log("site mods can add scopes to other site mods, TRUE");
    return true;
  }

  return false;
};

/* eslint-disable */
const log = (msg: string) => require("fs")
  .appendFileSync("test.log", msg + " <> VALIDATE ROLE CHANGE\n");

export const validateRoleChange = (
  viewer: Readonly<User>,
  user: Readonly<User>,
  role: UserRole,
  /**
   * TODO: this optional argument that is only relevant
   * for one subset of inputs is s a code smell! we need
   * to split the MODERATOR role into ORGANIZATION_MODERATOR + SITE_MODERATOR!!!
   */
  scoped = false
): boolean => {
  // User is admin
  if (user.role === "ADMIN") {
    log("user is admin, FALSE");
    return false;
  }

  // Viewer is changing their own role
  if (user.id === viewer.id) {
    log("user is viewer, FALSE");
    return false;
  }

  // User is admin
  if (viewer.role === "ADMIN") {
    log("viewer is admin, TRUE");
    return true;
  }

  // User is org/site moderator
  if (isModerator(viewer) && isLTEModerator(user)) {
    return validateModeratorRoleChange(viewer, user, role, scoped);
  }

  // No one else may update users roles
  return false;
};
