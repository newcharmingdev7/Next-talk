import * as React from "react";
import { StatelessComponent } from "react";

import Logo from "talk-stream/components/Logo";
import { Button, Flex, Typography } from "talk-ui/components";
import CommentContainer from "../../containers/CommentContainer";
import * as styles from "./PermalinkView.css";

export interface InnerProps {
  comment: {} | null;
  assetURL: string | null;
}

const PermalinkView: StatelessComponent<InnerProps> = ({
  assetURL,
  comment,
}) => {
  if (comment) {
    return (
      <div className={styles.root}>
        <Logo />
        {assetURL && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              window.location.href = assetURL;
            }}
            fullWidth
          >
            Show all Comments
          </Button>
        )}
        <Flex direction="column" className={styles.comment}>
          <CommentContainer data={comment} />
        </Flex>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Logo />
      <Typography className={styles.commentNotFound}>
        Comment not found
      </Typography>
      {assetURL && (
        <Button
          variant="filled"
          color="primary"
          onClick={() => {
            window.location.href = assetURL;
          }}
        >
          Show all Comments
        </Button>
      )}
    </div>
  );
};

export default PermalinkView;
