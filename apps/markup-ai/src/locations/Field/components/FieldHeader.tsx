/**
 * Field header component with Check button and configuration controls
 */

import React, { useState, useEffect } from "react";
import { Button, Select, IconButton, Tooltip } from "@contentful/f36-components";
import { GearSixIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { useUserSettings } from "../../../hooks/useUserSettings";
import { useContentTypeDefaults } from "../../../hooks/useContentTypeDefaults";
import { useConfigData } from "../../../contexts/ConfigDataContext";
import { useAuth } from "../../../contexts/AuthContext";
import { TONE_NONE } from "../../../utils/userSettings";
import { formatDialectShort, capitalize } from "../../Dialog/FieldCheck/utils/format";

const HeaderContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${tokens.spacingS};
  flex-wrap: nowrap;
`;

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const LogoImage = styled.img`
  height: 14px;
  width: auto;
`;

const ConfigControlsInline = styled.div<{ $isVisible: boolean }>`
  display: ${(props) => (props.$isVisible ? "inline-flex" : "none")};
  align-items: center;
  gap: ${tokens.spacingS};
  padding-left: ${tokens.spacingS};
  border-left: 1px solid ${tokens.gray300};
`;

const CompactSelect = styled(Select)`
  width: 110px;

  & select {
    font-size: ${tokens.fontSizeS};
    padding: 2px 24px 2px 6px;
    height: 28px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
`;

const SelectLabel = styled.span`
  font-size: 11px;
  color: ${tokens.gray600};
  white-space: nowrap;
`;

const SelectGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export interface FieldHeaderProps {
  onCheckClick: () => void;
  isDisabled?: boolean;
}

export const FieldHeader: React.FC<FieldHeaderProps> = ({ onCheckClick, isDisabled = false }) => {
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);

  // Check if user is signed in
  const { isAuthenticated } = useAuth();

  // Get content type defaults and field info from app installation parameters
  const {
    defaults: contentTypeDefaults,
    isLoading: defaultsLoading,
    contentTypeId,
    fieldId,
  } = useContentTypeDefaults();

  // Get user settings with content type defaults as fallback, scoped to this field
  const { effectiveSettings, fieldSettings, updateDialect, updateTone, updateStyleGuide } =
    useUserSettings({
      contentTypeId: contentTypeId ?? undefined,
      fieldId: fieldId ?? undefined,
      contentTypeDefaults,
    });

  // Get constants and style guides from context (single API call shared across app)
  const { constants, styleGuides, isLoading: configLoading } = useConfigData();

  // Only show loading state if user is authenticated (otherwise config controls are disabled anyway)
  const isLoading = isAuthenticated && (configLoading || defaultsLoading);

  // Gear icon should be disabled if user is not signed in
  const isGearDisabled = !isAuthenticated;

  // Collapse config panel when user signs out
  useEffect(() => {
    if (!isAuthenticated && isConfigExpanded) {
      setIsConfigExpanded(false);
    }
  }, [isAuthenticated, isConfigExpanded]);

  const dialectOptions = constants?.dialects || [];
  const toneOptions = constants?.tones || [];
  const styleGuideOptions = styleGuides || [];

  // Use shared format utilities
  const formatDialect = formatDialectShort;
  const formatTone = capitalize;

  return (
    <HeaderContainer>
      <Button variant="secondary" size="small" onClick={onCheckClick} isDisabled={isDisabled}>
        <ButtonContent>
          <LogoImage src="logos/markup_Logo_Mark_Coral.svg" alt="Markup AI" />
          Markup AI
        </ButtonContent>
      </Button>

      <Tooltip
        content="Sign in by clicking Markup AI to configure settings"
        isVisible={isGearDisabled ? undefined : false}
      >
        <IconButton
          aria-label={isConfigExpanded ? "Hide configuration" : "Show configuration"}
          icon={<GearSixIcon />}
          variant="secondary"
          size="small"
          isDisabled={isGearDisabled}
          onClick={() => {
            if (!isGearDisabled) {
              setIsConfigExpanded(!isConfigExpanded);
            }
          }}
        />
      </Tooltip>

      <ConfigControlsInline $isVisible={isConfigExpanded}>
        {/* Style Guide */}
        <SelectGroup>
          <SelectLabel>Style Guide</SelectLabel>
          <CompactSelect
            value={isLoading ? "" : (effectiveSettings.styleGuide ?? "")}
            onChange={(e) => {
              updateStyleGuide(e.target.value || null);
            }}
            size="small"
            isDisabled={isDisabled || isLoading || !styleGuideOptions.length}
          >
            {isLoading && <Select.Option value="">Loading...</Select.Option>}
            {!isLoading && !styleGuideOptions.length && (
              <Select.Option value="">No style guides</Select.Option>
            )}
            {styleGuideOptions.map((sg) => (
              <Select.Option key={sg.id} value={sg.id}>
                {sg.name}
              </Select.Option>
            ))}
          </CompactSelect>
        </SelectGroup>

        {/* Dialect */}
        <SelectGroup>
          <SelectLabel>Dialect</SelectLabel>
          <CompactSelect
            value={isLoading ? "" : (effectiveSettings.dialect ?? "")}
            onChange={(e) => {
              updateDialect(e.target.value || null);
            }}
            size="small"
            isDisabled={isDisabled || isLoading || !dialectOptions.length}
          >
            {isLoading && <Select.Option value="">Loading...</Select.Option>}
            {!isLoading && !dialectOptions.length && (
              <Select.Option value="">No dialects</Select.Option>
            )}
            {dialectOptions.map((d) => (
              <Select.Option key={d} value={d}>
                {formatDialect(d)}
              </Select.Option>
            ))}
          </CompactSelect>
        </SelectGroup>

        {/* Tone */}
        <SelectGroup>
          <SelectLabel>Tone</SelectLabel>
          <CompactSelect
            value={isLoading ? "" : (fieldSettings.tone ?? "")}
            onChange={(e) => {
              // Empty string means "use default", convert to null
              updateTone(e.target.value || null);
            }}
            size="small"
            isDisabled={isDisabled || isLoading}
          >
            {isLoading ? (
              <Select.Option value="">Loading...</Select.Option>
            ) : (
              <>
                <Select.Option value="">Default</Select.Option>
                <Select.Option value={TONE_NONE}>None</Select.Option>
                {toneOptions.map((t) => (
                  <Select.Option key={t} value={t}>
                    {formatTone(t)}
                  </Select.Option>
                ))}
              </>
            )}
          </CompactSelect>
        </SelectGroup>
      </ConfigControlsInline>
    </HeaderContainer>
  );
};
