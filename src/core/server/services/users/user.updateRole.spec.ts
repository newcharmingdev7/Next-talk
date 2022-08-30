import { MongoContext } from "coral-server/data/context";
import { UserForbiddenError } from "coral-server/errors";
import { GQLUSER_ROLE } from "coral-server/graph/schema/__generated__/types";
import { Tenant } from "coral-server/models/tenant";
import { User } from "coral-server/models/user";
import { createMockMongoContex } from "coral-server/test/mocks";

import {
  createSiteFixture,
  createTenantFixture,
  createUserFixture,
} from "../../test/fixtures";
import { updateRole } from "./users";

jest.mock("coral-server/models/user");

const ROLES = Object.values(GQLUSER_ROLE);
const mockTenant = createTenantFixture();
const tenantID = mockTenant.id;
const site1 = createSiteFixture({
  tenantID: mockTenant.id,
});
const admin = createUserFixture({
  role: GQLUSER_ROLE.ADMIN,
  tenantID,
});
const orgMod = createUserFixture({
  role: GQLUSER_ROLE.MODERATOR,
  tenantID,
});
const site1Mod = createUserFixture({
  tenantID,
  role: GQLUSER_ROLE.MODERATOR,
  moderationScopes: {
    siteIDs: [site1.id],
  },
});
const site1Staff = createUserFixture({
  tenantID,
  role: GQLUSER_ROLE.STAFF, // Hmm, the way we determine staff status in src/server/services/comment/pipeline/phases/tagStaff.ts seems to just tag site mods?
  moderationScopes: {
    siteIDs: [site1.id],
  },
});
const site1Member = createUserFixture({
  tenantID,
  role: GQLUSER_ROLE.MEMBER,
  membershipScopes: {
    siteIDs: [site1.id],
  },
});
const site1Commenter = createUserFixture({
  tenantID,
  role: GQLUSER_ROLE.COMMENTER,
});
const users = [
  admin,
  orgMod,
  site1Mod,
  site1Staff,
  site1Member,
  site1Commenter,
];

const inputStr = (
  viewerRole: GQLUSER_ROLE,
  userFromRole: GQLUSER_ROLE,
  userToRole: GQLUSER_ROLE
) =>
  `viewer role = ${viewerRole}, user from role = ${userFromRole},  userToRole = ${userToRole}`;

describe("updateRole", () => {
  let mongo: MongoContext;

  /* eslint-disable-next-line */
  require("coral-server/models/user").retrieveUser.mockImplementation(
    async (_mongo: any, _tenantID: any, userID: string) =>
      users.find(({ id }) => id === userID)
  );

  /* eslint-disable-next-line */
  require("coral-server/models/user").updateUserRole.mockImplementation(
    async (
      _mongo: any,
      _tenantID: any,
      userID: string,
      role: GQLUSER_ROLE
    ) => ({
      ...users.find(({ id }) => id === userID),
      role,
    })
  );

  let uut: (
    mongo: MongoContext,
    tenant: Tenant,
    viewer: User,
    user: User,
    role: GQLUSER_ROLE,
    siteIDs?: string[]
  ) => ReturnType<typeof updateRole>;

  const exhaustiveInputs = new Map<string, boolean>();
  beforeAll(() => {
    ({ ctx: mongo } = createMockMongoContex());

    // Wrapping our function to track what inputs have been tested
    uut = (mongoCtx, tenant, viewer, user, role, siteIDs) => {
      const inputHash = inputStr(viewer.role, user.role, role);
      exhaustiveInputs.set(inputHash, true);

      return updateRole(mongo, tenant, viewer, user.id, role, siteIDs);
    };

    for (const viewer of users) {
      for (const user of users) {
        for (const newRole of ROLES) {
          const inputHash = inputStr(viewer.role, user.role, newRole);
          exhaustiveInputs.set(inputHash, false);
        }
      }
    }
  });

  it("allows admins to assign any user any role", async () => {
    const nonAdmins = users.filter(({ role }) => role !== GQLUSER_ROLE.ADMIN);
    for (const user of nonAdmins) {
      for (const role of ROLES) {
        const res = await uut(mongo, mockTenant, admin, user, role);

        expect(res.role).toEqual(role);
      }
    }
  });

  it("allows org mods to allocate (site) mods", async () => {
    const nonMods = [site1Staff, site1Member, site1Commenter];
    for (const user of nonMods) {
      const res = await uut(
        mongo,
        mockTenant,
        orgMod,
        user,
        GQLUSER_ROLE.MODERATOR,
        [site1.id]
      );

      expect(res.role).toEqual(GQLUSER_ROLE.MODERATOR);
    }
  });

  it("does not allow site mods, staff, members, or commenters to change anyones role", async () => {
    const cannotChangeRoles = [
      site1Mod,
      site1Staff,
      site1Member,
      site1Commenter,
    ];
    for (const viewer of cannotChangeRoles) {
      const otherUsers = users.filter(({ id }) => id !== viewer.id);
      for (const user of otherUsers) {
        for (const role of ROLES) {
          await expect(async () => {
            await uut(mongo, mockTenant, viewer, user, role);
          }).rejects.toThrow(UserForbiddenError);
        }
      }
    }
  });

  it("does not allow users to change their own role", async () => {
    for (const user of users) {
      for (const role of ROLES) {
        await expect(
          async () => await uut(mongo, mockTenant, user, user, role)
        ).rejects.toThrow(UserForbiddenError);
      }
    }
  });

  it("does not allow users < admin to allocate new admins", async () => {
    const ltAdminUsers = users.filter(
      ({ role }) => role !== GQLUSER_ROLE.ADMIN
    );
    for (const user of ltAdminUsers) {
      const otherUsers = users.filter(({ id }) => id !== user.id);
      for (const otherUser of otherUsers) {
        await expect(
          async () =>
            await uut(mongo, mockTenant, user, otherUser, GQLUSER_ROLE.ADMIN)
        ).rejects.toThrow(UserForbiddenError);
      }
    }
  });

  /**
   * IMPORTANT: this must be the last test in the suite!!!
   */
  it("saw all inputs", () => {
    const unseenInputs: string[] = [];
    for (const [inputHash, seen] of exhaustiveInputs.entries()) {
      if (!seen) {
        unseenInputs.push(inputHash);
      }
    }

    expect(unseenInputs).toEqual([]);
  });
});
