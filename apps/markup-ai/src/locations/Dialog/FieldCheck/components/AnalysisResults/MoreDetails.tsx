/**
 * More details expandable section for analysis results
 */

import React, { useState } from "react";
import { Button, Collapse, Box } from "@contentful/f36-components";
import { CaretDownIcon, CaretUpIcon } from "@contentful/f36-icons";
import type { ScoreOutput } from "../../../../../api-client/types.gen";
import { DetailsSection, DetailRow, DetailLabel, DetailValue } from "./AnalysisResults.styles";

export interface MoreDetailsProps {
  scores?: ScoreOutput;
}

export const MoreDetails: React.FC<MoreDetailsProps> = ({ scores }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!scores) {
    return null;
  }

  const clarityScore = scores.analysis?.clarity?.score;
  const toneScore = scores.analysis?.tone?.score;

  const hasDetails = clarityScore || toneScore;

  if (!hasDetails) {
    return null;
  }

  return (
    <Box>
      <Button
        variant="transparent"
        size="small"
        startIcon={isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
        isFullWidth
      >
        {isExpanded ? "Hide" : "Show"} More Details
      </Button>
      <Collapse isExpanded={isExpanded}>
        <Box marginTop="spacingS">
          <DetailsSection>
            {clarityScore !== undefined && clarityScore !== null && (
              <DetailRow>
                <DetailLabel>Clarity</DetailLabel>
                <DetailValue>{Math.round(clarityScore)}</DetailValue>
              </DetailRow>
            )}
            {toneScore !== undefined && toneScore !== null && (
              <DetailRow>
                <DetailLabel>Tone</DetailLabel>
                <DetailValue>{Math.round(toneScore)}</DetailValue>
              </DetailRow>
            )}
          </DetailsSection>
        </Box>
      </Collapse>
    </Box>
  );
};
