import React from "react";
import { FormControl, Select } from "@contentful/f36-components";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import type { StyleGuideSummaryResponse } from "../../../api-client/types.gen";

const Wrapper = styled.div`
  margin-top: ${tokens.spacingS};
  padding-top: ${tokens.spacingS};
  border-top: 1px solid ${tokens.gray200};
  max-width: 360px;
`;

export interface ContentTypeStyleGuideSelectProps {
  contentTypeId: string;
  /** Currently configured style guide id for this content type, or null. */
  value: string | null;
  /** Style guide options pre-fetched once at the screen level. */
  styleGuides: StyleGuideSummaryResponse[];
  isLoading: boolean;
  isError: boolean;
  /** False when the user is not signed in — keeps the dropdown disabled. */
  isAuthenticated: boolean;
  onChange: (contentTypeId: string, styleGuideId: string | null) => void;
}

/**
 * Per-content-type default style guide picker for the app config screen.
 * Pure presentational: receives `styleGuides` from a single fetch up the tree
 * so we never trigger N requests for N content types.
 */
export const ContentTypeStyleGuideSelect: React.FC<ContentTypeStyleGuideSelectProps> = ({
  contentTypeId,
  value,
  styleGuides,
  isLoading,
  isError,
  isAuthenticated,
  onChange,
}) => {
  const enabledStyleGuides = styleGuides.filter((g) => g.enabled);
  const hasOptions = enabledStyleGuides.length > 0;
  const isDisabled = !isAuthenticated || isLoading || isError || !hasOptions;

  let helpText: string;
  if (!isAuthenticated) helpText = "Sign in to choose a default style guide.";
  else if (isError) helpText = "Failed to load style guides.";
  else if (isLoading) helpText = "Loading style guides…";
  else if (hasOptions) helpText = "Applies to all enabled fields of this content type.";
  else helpText = "No style guides available for this account.";

  return (
    <Wrapper>
      <FormControl>
        <FormControl.Label>Default style guide</FormControl.Label>
        <Select
          id={`content-type-style-guide-${contentTypeId}`}
          value={value ?? ""}
          isDisabled={isDisabled}
          onChange={(e) => {
            onChange(contentTypeId, e.target.value || null);
          }}
        >
          <Select.Option value="">No default</Select.Option>
          {enabledStyleGuides.map((g) => (
            <Select.Option key={g.id} value={g.id}>
              {g.display_name}
            </Select.Option>
          ))}
        </Select>
        <FormControl.HelpText>{helpText}</FormControl.HelpText>
      </FormControl>
    </Wrapper>
  );
};

export default ContentTypeStyleGuideSelect;
