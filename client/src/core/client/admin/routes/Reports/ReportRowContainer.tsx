import { useRouter } from "found";
import React, { useCallback } from "react";
import { graphql } from "react-relay";

import { useDateTimeFormatter } from "coral-framework/hooks";
import { withFragmentContainer } from "coral-framework/lib/relay";
import { RelativeTime, TableCell, TableRow } from "coral-ui/components/v2";

import {
  DSAReportStatus,
  ReportRowContainer_dsaReport as DSAReportData,
} from "coral-admin/__generated__/ReportRowContainer_dsaReport.graphql";

import { statusMappings } from "./SingleReportRoute";

interface Props {
  dsaReport: DSAReportData;
}

const ReportRowContainer: React.FunctionComponent<Props> = ({ dsaReport }) => {
  const formatter = useDateTimeFormatter({
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const { router } = useRouter();

  const statusMapping = useCallback((status: DSAReportStatus | null) => {
    if (!status) {
      return "Unknown status";
    }
    return statusMappings[status];
  }, []);

  const onReportRowClick = useCallback(
    (reportID: string) => {
      router.replace(`/admin/reports/report/${reportID}`);
    },
    [router]
  );

  return (
    <TableRow
      key={dsaReport.referenceID}
      onClick={() => onReportRowClick(dsaReport.id)}
    >
      <TableCell>{formatter(dsaReport.createdAt)}</TableCell>
      <TableCell>
        <RelativeTime date={dsaReport.createdAt} />
      </TableCell>
      <TableCell>{dsaReport.reporter?.username}</TableCell>
      <TableCell>{dsaReport.referenceID}</TableCell>
      <TableCell>{dsaReport.lawBrokenDescription}</TableCell>
      <TableCell>{dsaReport.comment?.author?.username}</TableCell>
      <TableCell>{statusMapping(dsaReport.status)}</TableCell>
    </TableRow>
  );
};

const enhanced = withFragmentContainer<Props>({
  dsaReport: graphql`
    fragment ReportRowContainer_dsaReport on DSAReport {
      id
      createdAt
      referenceID
      status
      reporter {
        username
      }
      comment {
        author {
          username
        }
      }
      lawBrokenDescription
    }
  `,
})(ReportRowContainer);

export default enhanced;
