import { Localized } from "fluent-react/compat";
import React from "react";
import { StatelessComponent } from "react";
import { Button, Popover, Typography } from "talk-ui/components";
import PermalinkPopover from "../PermalinkPopover";
import Timestamp from "./Timestamp";
import TopBar from "./TopBar";
import Username from "./Username";

export interface CommentProps {
  id: string;
  className?: string;
  author: {
    username: string;
  } | null;
  body: string | null;
  createdAt: string;
}

const Comment: StatelessComponent<CommentProps> = props => {
  return (
    <div role="article">
      <TopBar>
        {props.author && <Username>{props.author.username}</Username>}
        <Timestamp>{props.createdAt}</Timestamp>
      </TopBar>
      <Typography>{props.body}</Typography>
      <div>
        <Popover body={<PermalinkPopover commentId={props.id} />}>
          {({ toggleShow, ref }) => (
            <Button
              onClick={toggleShow}
              style={{ color: "red" }}
              innerRef={ref}
            >
              <Localized id="comments-permalink-share">
                <span>Share</span>
              </Localized>
            </Button>
          )}
        </Popover>
      </div>
    </div>
  );
};

export default Comment;
