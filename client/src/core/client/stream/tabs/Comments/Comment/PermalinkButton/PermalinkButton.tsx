import { Localized } from "@fluent/react/compat";
import React, { ComponentType, FunctionComponent } from "react";
import Responsive from "react-responsive";

import CLASSES from "coral-stream/classes";
import { ShareIcon, SvgIcon } from "coral-ui/components/icons";
import { ClickOutside, Flex, Popover } from "coral-ui/components/v2";
import { Button } from "coral-ui/components/v3";

import PermalinkPopover from "./PermalinkPopover";

import styles from "./PermalinkButton.css";

interface PermalinkProps {
  commentID: string;
  url: string;
  author?: string | null;
  buttonText?: string;
  buttonTextID?: string;
  ButtonIcon?: ComponentType;
}

const Permalink: FunctionComponent<PermalinkProps> = ({
  commentID,
  url,
  author,
  buttonText,
  buttonTextID,
  ButtonIcon,
}) => {
  const popoverID = `permalink-popover-${commentID}`;
  const text = buttonText ?? "Share";
  const textID = buttonTextID ?? "comments-permalinkButton-share";
  return (
    <Localized id="comments-permalinkPopover" attrs={{ description: true }}>
      <Popover
        id={popoverID}
        placement="bottom"
        description="A dialog showing a permalink to the comment"
        modifiers={{
          arrow: {
            enabled: false,
          },
        }}
        body={({ toggleVisibility }) => (
          <ClickOutside onClickOutside={toggleVisibility}>
            <PermalinkPopover
              permalinkURL={url}
              commentID={commentID}
              toggleVisibility={toggleVisibility}
            />
          </ClickOutside>
        )}
      >
        {({ toggleVisibility, ref, visible }) => (
          <Localized
            id="comments-permalinkButton"
            attrs={{ "aria-label": true }}
            vars={{ username: author ?? "" }}
          >
            <Button
              onClick={toggleVisibility}
              aria-controls={popoverID}
              ref={ref}
              active={visible}
              variant="flat"
              color="secondary"
              fontSize="small"
              fontWeight="semiBold"
              paddingSize="extraSmall"
              className={CLASSES.comment.actionBar.shareButton}
            >
              <Flex alignItems="center" container="span">
                <SvgIcon
                  className={styles.icon}
                  Icon={ButtonIcon ?? ShareIcon}
                />
                <Responsive minWidth={400}>
                  <Localized id={textID}>
                    <span>{text}</span>
                  </Localized>
                </Responsive>
              </Flex>
            </Button>
          </Localized>
        )}
      </Popover>
    </Localized>
  );
};

export default Permalink;
