import React from "react";
import { StatelessComponent } from "react";

import { Typography, ValidationMessage } from "talk-ui/components";

import Timestamp from "./Timestamp";
import TopBar from "./TopBar";
import Username from "./Username";

export interface CommentProps {
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
      <ValidationMessage color="error">
        Invalid characters. Try again
      </ValidationMessage>
    </div>
  );
};

export default Comment;
