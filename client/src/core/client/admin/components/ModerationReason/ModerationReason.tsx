import React, { FunctionComponent, useCallback, useState } from "react";

import { Button, Card, Modal, RadioButton } from "coral-ui/components/v2";

import { RejectCommentReasonInput } from "coral-stream/__generated__/RejectCommentMutation.graphql";

import { GQLREJECTION_REASON_CODE } from "coral-framework/schema";
import { TextArea } from "coral-ui/components/v3";
import styles from "./ModerationReason.css";

type Reason = RejectCommentReasonInput;
type ReasonCode = GQLREJECTION_REASON_CODE;

export interface Props {
  open: boolean;
  onReason: (reason: Reason) => void;
}

const ModerationReason: FunctionComponent<Props> = ({ open, onReason }) => {
  const [reasonCode, setReasonCode] = useState<ReasonCode | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submitReason = useCallback(() => {
    onReason({
      code: reasonCode!,
      additionalInfo:
        reasonCode === GQLREJECTION_REASON_CODE.OTHER ? info : undefined,
    });
  }, [reasonCode, info]);

  return (
    <Modal open={open}>
      <Card className={styles.root} data-testid="moderation-reason-modal">
        <h2>Temp Moderation Reason Modal</h2>
        {Object.values(GQLREJECTION_REASON_CODE)
          .filter((code) => code !== GQLREJECTION_REASON_CODE.ILLEGAL_CONTENT)
          .map((code) => (
            <RadioButton
              value={code}
              name={code}
              key={code}
              checked={reasonCode === code}
              onChange={(e) => {
                if (e.target.checked) {
                  setReasonCode(code);
                }
              }}
            >
              {code}
            </RadioButton>
          ))}

        {reasonCode === GQLREJECTION_REASON_CODE.OTHER && (
          <TextArea
            value={info || undefined}
            onChange={(e) => setInfo(e.target.value)}
          />
        )}

        <Button disabled={reasonCode === null} onClick={submitReason}>
          Submit
        </Button>
      </Card>
    </Modal>
  );
};

export default ModerationReason;
