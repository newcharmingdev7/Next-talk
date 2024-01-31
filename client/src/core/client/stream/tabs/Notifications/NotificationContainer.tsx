import { FluentBundle } from "@fluent/bundle/compat";
import cn from "classnames";
import React, { ComponentType, FunctionComponent, useMemo } from "react";
import { graphql } from "react-relay";

import { useCoralContext } from "coral-framework/lib/bootstrap";
import { getMessage } from "coral-framework/lib/i18n";
import { withFragmentContainer } from "coral-framework/lib/relay";
import { GQLNOTIFICATION_TYPE } from "coral-framework/schema";
import {
  CheckCircleIcon,
  LegalHammerIcon,
  MessagesBubbleSquareTextIcon,
  QuestionCircleIcon,
  RejectCommentBoxIcon,
  SvgIcon,
} from "coral-ui/components/icons";
import { Timestamp } from "coral-ui/components/v2";

import {
  NOTIFICATION_TYPE,
  NotificationContainer_notification,
} from "coral-stream/__generated__/NotificationContainer_notification.graphql";
import { NotificationContainer_viewer } from "coral-stream/__generated__/NotificationContainer_viewer.graphql";

import ApprovedCommentNotificationBody from "./ApprovedCommentNotificationBody";
import DSAReportDecisionMadeNotificationBody from "./DSAReportDecisionMadeNotificationBody";
import FeaturedCommentNotificationBody from "./FeaturedCommentNotificationBody";
import RejectedCommentNotificationBody from "./RejectedCommentNotificationBody";
import RepliedCommentNotificationBody from "./RepliedCommentNotificationBody";

import styles from "./NotificationContainer.css";

interface Props {
  viewer: NotificationContainer_viewer | null;
  notification: NotificationContainer_notification;
}

const getIcon = (type: NOTIFICATION_TYPE | null): ComponentType => {
  if (type === GQLNOTIFICATION_TYPE.COMMENT_APPROVED) {
    return CheckCircleIcon;
  }
  if (type === GQLNOTIFICATION_TYPE.COMMENT_FEATURED) {
    return CheckCircleIcon;
  }
  if (type === GQLNOTIFICATION_TYPE.COMMENT_REJECTED) {
    return RejectCommentBoxIcon;
  }
  if (type === GQLNOTIFICATION_TYPE.ILLEGAL_REJECTED) {
    return RejectCommentBoxIcon;
  }
  if (type === GQLNOTIFICATION_TYPE.DSA_REPORT_DECISION_MADE) {
    return LegalHammerIcon;
  }
  if (type === GQLNOTIFICATION_TYPE.REPLY) {
    return MessagesBubbleSquareTextIcon;
  }
  if (type === GQLNOTIFICATION_TYPE.REPLY_STAFF) {
    return MessagesBubbleSquareTextIcon;
  }
  return QuestionCircleIcon;
};

const getTitle = (bundles: FluentBundle[], type: NOTIFICATION_TYPE | null) => {
  if (type === GQLNOTIFICATION_TYPE.COMMENT_APPROVED) {
    return getMessage(
      bundles,
      "notifications-yourCommentHasBeenApproved",
      "Your comment has been approved"
    );
  }
  if (type === GQLNOTIFICATION_TYPE.COMMENT_FEATURED) {
    return getMessage(
      bundles,
      "notifications-yourCommentHasBeenFeatured",
      "Your comment has been featured"
    );
  }
  if (type === GQLNOTIFICATION_TYPE.COMMENT_REJECTED) {
    return getMessage(
      bundles,
      "notifications-yourCommentHasBeenRejected",
      "Your comment has been rejected"
    );
  }
  if (type === GQLNOTIFICATION_TYPE.ILLEGAL_REJECTED) {
    return getMessage(
      bundles,
      "notifications-yourCommentHasBeenRejected",
      "Your comment has been rejected"
    );
  }
  if (type === GQLNOTIFICATION_TYPE.DSA_REPORT_DECISION_MADE) {
    return getMessage(
      bundles,
      "notifications-yourIllegalContentReportHasBeenReviewed",
      "Your illegal content report has been reviewed"
    );
  }
  if (type === GQLNOTIFICATION_TYPE.REPLY) {
    return getMessage(
      bundles,
      "notifications-yourCommentHasReceivedAReply",
      "Your comment has received a reply"
    );
  }
  if (type === GQLNOTIFICATION_TYPE.REPLY_STAFF) {
    return getMessage(
      bundles,
      "notifications-yourCommentHasReceivedAStaffReply",
      "Your comment has received a reply from a member of our team"
    );
  }

  return getMessage(bundles, "notifications-defaultTitle", "Notification");
};

const NotificationContainer: FunctionComponent<Props> = ({
  notification,
  viewer,
}) => {
  const { type, createdAt } = notification;
  const { localeBundles } = useCoralContext();

  const seen = useMemo(() => {
    if (!viewer) {
      return false;
    }

    const createdAtDate = new Date(createdAt);
    const lastSeenDate = viewer.lastSeenNotificationDate
      ? new Date(viewer.lastSeenNotificationDate)
      : new Date(0);

    return createdAtDate.getTime() <= lastSeenDate.getTime();
  }, [createdAt, viewer]);

  return (
    <>
      <div
        className={cn(styles.root, {
          [styles.seen]: seen,
          [styles.notSeen]: !seen,
        })}
      >
        <div className={styles.title}>
          <SvgIcon size="sm" Icon={getIcon(type)} />
          <div className={styles.titleText}>
            {getTitle(localeBundles, type)}
          </div>
        </div>
        {(type === GQLNOTIFICATION_TYPE.COMMENT_REJECTED ||
          type === GQLNOTIFICATION_TYPE.ILLEGAL_REJECTED) && (
          <RejectedCommentNotificationBody notification={notification} />
        )}
        {type === GQLNOTIFICATION_TYPE.DSA_REPORT_DECISION_MADE && (
          <DSAReportDecisionMadeNotificationBody notification={notification} />
        )}
        {(type === GQLNOTIFICATION_TYPE.REPLY ||
          type === GQLNOTIFICATION_TYPE.REPLY_STAFF) && (
          <RepliedCommentNotificationBody notification={notification} />
        )}
        {type === GQLNOTIFICATION_TYPE.COMMENT_FEATURED && (
          <FeaturedCommentNotificationBody notification={notification} />
        )}
        {type === GQLNOTIFICATION_TYPE.COMMENT_APPROVED && (
          <ApprovedCommentNotificationBody notification={notification} />
        )}
        <div className={styles.footer}>
          <Timestamp className={styles.timestamp}>{createdAt}</Timestamp>
        </div>
      </div>
      <div className={styles.divider}></div>
    </>
  );
};

const enhanced = withFragmentContainer<Props>({
  viewer: graphql`
    fragment NotificationContainer_viewer on User {
      lastSeenNotificationDate
    }
  `,
  notification: graphql`
    fragment NotificationContainer_notification on Notification {
      id
      createdAt
      type
      commentStatus
      comment {
        ...NotificationCommentContainer_comment
      }
      ...RejectedCommentNotificationBody_notification
      ...DSAReportDecisionMadeNotificationBody_notification
      ...RepliedCommentNotificationBody_notification
      ...FeaturedCommentNotificationBody_notification
      ...ApprovedCommentNotificationBody_notification
    }
  `,
})(NotificationContainer);

export default enhanced;
