import cn from "classnames";
import React, { Ref } from "react";
import TimeAgo, { Formatter } from "react-timeago";

import { UIContext } from "talk-ui/components";
import { withForwardRef, withStyles } from "talk-ui/hocs";
import { PropTypesOf } from "talk-ui/types";

import * as styles from "./RelativeTime.css";

interface InnerProps {
  date: string;
  live?: boolean;
  classes: typeof styles;
  className?: string;
  formatter?: Formatter;

  /** Ref to the root element */
  ref?: Ref<HTMLDivElement>;

  /** Internal: Forwarded Ref */
  forwardRef?: Ref<HTMLDivElement>;
}

const defaultFormatter: Formatter = (value, unit, suffix, timestamp: string) =>
  new Date(timestamp).toISOString();

class RelativeTime extends React.Component<InnerProps> {
  public render() {
    const { date, classes, live, className, formatter } = this.props;
    return (
      <UIContext.Consumer>
        {({ timeagoFormatter }) => (
          <TimeAgo
            date={date}
            className={cn(className, classes.root)}
            live={live}
            formatter={timeagoFormatter || formatter || defaultFormatter}
          />
        )}
      </UIContext.Consumer>
    );
  }
}

const enhanced = withForwardRef(withStyles(styles)(RelativeTime));
export type RelativeTimeProps = PropTypesOf<typeof enhanced>;
export default enhanced;
