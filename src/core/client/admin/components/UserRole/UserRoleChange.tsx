import { Localized } from "@fluent/react/compat";
import React, {
  FunctionComponent,
  useCallback,
  useMemo,
  useState,
} from "react";

import { validateRoleChange } from "coral-common/permissions";

import { useToggleState } from "coral-framework/hooks";
import { GQLUSER_ROLE, GQLUSER_ROLE_RL } from "coral-framework/schema";
import {
  Button,
  ButtonIcon,
  ClickOutside,
  Dropdown,
  Popover,
} from "coral-ui/components/v2";

import { UserRoleChangeContainer_user } from "coral-admin/__generated__/UserRoleChangeContainer_user.graphql";
import { UserRoleChangeContainer_viewer } from "coral-admin/__generated__/UserRoleChangeContainer_viewer.graphql";

import SiteRoleModal from "./SiteRoleModal";
import UserRoleChangeButton from "./UserRoleChangeButton";
import UserRoleText from "./UserRoleText";

import styles from "./UserRoleChange.css";

interface Props {
  user: UserRoleChangeContainer_user;
  onChangeRole: (role: GQLUSER_ROLE_RL, siteIDs?: string[]) => Promise<void>;
  onChangeModerationScopes: (siteIDs: string[]) => Promise<void>;
  onChangeMembershipScopes: (siteIDs: string[]) => Promise<void>;
  role: GQLUSER_ROLE_RL;
  moderationScoped?: boolean;
  membershipScoped?: boolean;
  moderationScopes: UserRoleChangeContainer_user["moderationScopes"];
  membershipScopes: UserRoleChangeContainer_user["membershipScopes"];
  moderationScopesEnabled?: boolean;
  viewer: UserRoleChangeContainer_viewer;
}

const UserRoleChange: FunctionComponent<Props> = ({
  user,
  role,
  membershipScoped,
  moderationScoped,
  onChangeRole,
  onChangeModerationScopes,
  moderationScopes,
  onChangeMembershipScopes,
  membershipScopes,
  moderationScopesEnabled = false,
  viewer,
}) => {
  const isDisallowed = useCallback(
    (newRole: GQLUSER_ROLE_RL, siteScoped = false) => {
      const viewerUser = {
        ...viewer,
        moderationScopes: {
          siteIDs: viewer.moderationScopes?.sites?.map(({ id }) => id) || [],
        },
      };

      return !validateRoleChange(viewerUser, user, newRole, siteScoped);
    },
    [viewer, user]
  );
  // Setup state and callbacks for the popover.
  const [
    isPopoverVisible,
    setPopoverVisibility,
    togglePopoverVisibility,
  ] = useToggleState();

  /**
   * handleChangeRole combines the change role function with the change
   * moderation scopes.
   */
  const handleChangeRole = useCallback(
    async (r: GQLUSER_ROLE_RL, siteIDs: string[] = []) => {
      // BOOKMARK: if role is new to having scopes, just pass scopes with changeRole
      await onChangeRole(r, siteIDs);
    },
    [onChangeRole]
  );
  const onClick = useCallback(
    (r: GQLUSER_ROLE_RL, siteIDs: string[] = []) => async () => {
      await handleChangeRole(r, siteIDs);
      togglePopoverVisibility();
    },
    [handleChangeRole, togglePopoverVisibility]
  );

  const [siteRole, setSiteRole] = useState<GQLUSER_ROLE | null>(null);

  const onFinishModal = useCallback(
    async (siteIDs: string[]) => {
      // BOOKMARK: potentially need to call
      /* eslint-disable */
      if (siteRole !== user.role) {
        await handleChangeRole(siteRole!, siteIDs);
      } else {
        await siteRole === GQLUSER_ROLE.MODERATOR ?
          onChangeModerationScopes(siteIDs) : onChangeMembershipScopes(siteIDs);
      }
      // Set the user as new role and then update the siteIDs.


      setSiteRole(null);
    },
    [siteRole, handleChangeRole]
  );

  const selectedModerationSiteIDs = useMemo(
    () => moderationScopes?.sites?.map((site) => site.id),
    [moderationScopes]
  );

  const selectedMembershipSiteIDs = useMemo(
    () => membershipScopes?.sites?.map((site) => site.id),
    [membershipScopes]
  );

  const showSiteRoleModal = !!siteRole;
  const siteRoleSiteIDs =
    siteRole === GQLUSER_ROLE.MODERATOR
      ? selectedModerationSiteIDs
      : siteRole === GQLUSER_ROLE.MEMBER
      ? selectedMembershipSiteIDs
      : [];

  return (
    <>
      <SiteRoleModal
        roleToBeSet={siteRole}
        username={user.username}
        open={showSiteRoleModal}
        selectedSiteIDs={siteRoleSiteIDs}
        onCancel={() => setSiteRole(null)}
        onFinish={(siteIDs: string[]) => onFinishModal(siteIDs)}
      />
      <Localized id="community-role-popover" attrs={{ description: true }}>
        <Popover
          id="community-roleChange"
          placement="bottom-start"
          description="A dropdown to change the user role"
          visible={isPopoverVisible}
          body={
            <ClickOutside onClickOutside={togglePopoverVisibility}>
              <Dropdown>
                <UserRoleChangeButton
                  active={role === GQLUSER_ROLE.COMMENTER}
                  disabled={isDisallowed(GQLUSER_ROLE.COMMENTER)}
                  role={GQLUSER_ROLE.COMMENTER}
                  moderationScopesEnabled={moderationScopesEnabled}
                  onClick={onClick(GQLUSER_ROLE.COMMENTER)}
                />
                <UserRoleChangeButton
                  active={membershipScoped && role === GQLUSER_ROLE.MEMBER}
                  disabled={isDisallowed(GQLUSER_ROLE.MEMBER)}
                  role={GQLUSER_ROLE.MEMBER}
                  moderationScopesEnabled={moderationScopesEnabled}
                  scoped
                  onClick={() => {
                    setSiteRole(GQLUSER_ROLE.MEMBER);
                    setPopoverVisibility(false);
                  }}
                />
                <UserRoleChangeButton
                  active={role === GQLUSER_ROLE.STAFF}
                  disabled={isDisallowed(GQLUSER_ROLE.STAFF)}
                  role={GQLUSER_ROLE.STAFF}
                  moderationScopesEnabled={moderationScopesEnabled}
                  onClick={onClick(GQLUSER_ROLE.STAFF)}
                />
                {moderationScopesEnabled && (
                  <UserRoleChangeButton
                    active={moderationScoped && role === GQLUSER_ROLE.MODERATOR}
                    disabled={isDisallowed(GQLUSER_ROLE.MODERATOR, true)}
                    role={GQLUSER_ROLE.MODERATOR}
                    scoped
                    moderationScopesEnabled
                    onClick={() => {
                      setSiteRole(GQLUSER_ROLE.MODERATOR);
                      setPopoverVisibility(false);
                    }}
                  />
                )}
                <UserRoleChangeButton
                  active={
                    (!moderationScopesEnabled ||
                      (moderationScopesEnabled && !moderationScoped)) &&
                    role === GQLUSER_ROLE.MODERATOR
                  }
                  disabled={isDisallowed(GQLUSER_ROLE.MODERATOR)}
                  role={GQLUSER_ROLE.MODERATOR}
                  moderationScopesEnabled={moderationScopesEnabled}
                  onClick={onClick(GQLUSER_ROLE.MODERATOR)}
                />
                <UserRoleChangeButton
                  active={role === GQLUSER_ROLE.ADMIN}
                  disabled={isDisallowed(GQLUSER_ROLE.ADMIN)}
                  role={GQLUSER_ROLE.ADMIN}
                  moderationScopesEnabled={moderationScopesEnabled}
                  onClick={onClick(GQLUSER_ROLE.ADMIN)}
                />
              </Dropdown>
            </ClickOutside>
          }
        >
          {({ ref }) => (
            <Localized
              id="community-changeRoleButton"
              attrs={{ "aria-label": true }}
            >
              <Button
                aria-label="Change role"
                className={styles.button}
                onClick={togglePopoverVisibility}
                uppercase={false}
                size="large"
                color="mono"
                ref={ref}
                variant="text"
              >
                <UserRoleText
                  moderationScopesEnabled={moderationScopesEnabled}
                  scoped={moderationScoped || membershipScoped}
                  role={role}
                />
                <ButtonIcon size="lg">
                  {isPopoverVisible ? "arrow_drop_up" : "arrow_drop_down"}
                </ButtonIcon>
              </Button>
            </Localized>
          )}
        </Popover>
      </Localized>
    </>
  );
};

export default UserRoleChange;
