/**
 * ContentTypeSettingsPanel - Collapsible panel for setting default style guide, dialect, and tone
 * for a specific content type. Only shown when user is authenticated.
 */

import React, { useState } from "react";
import { Select, IconButton } from "@contentful/f36-components";
import { CaretDownIcon, CaretUpIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import type { ContentTypeSettings } from "../../../types/appConfig";
import type { ConstantsResponse, StyleGuideResponse } from "../../../api-client/types.gen";
import { formatDialect, capitalize } from "../../Dialog/FieldCheck/utils/format";
import { DEFAULTS } from "../../../utils/userSettings";

const PanelWrapper = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed ${tokens.gray300};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 0;

  &:hover {
    opacity: 0.8;
  }
`;

const PanelTitle = styled.span`
  font-family: "Geist", sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: ${tokens.gray600};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PanelContent = styled.div<{ $isExpanded: boolean }>`
  display: ${({ $isExpanded }) => ($isExpanded ? "block" : "none")};
  padding: 12px;
  margin-top: 8px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid ${tokens.gray200};
`;

const SettingsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const SettingsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SettingsLabel = styled.label`
  font-family: "Geist", sans-serif;
  font-size: 12px;
  color: ${tokens.gray600};
  white-space: nowrap;
`;

const CompactSelect = styled(Select)`
  width: 140px;

  & select {
    font-size: 12px;
    padding: 4px 8px;
    height: 28px;
  }
`;

interface ContentTypeSettingsPanelProps {
  contentTypeId: string;
  settings: ContentTypeSettings;
  constants: ConstantsResponse | undefined;
  styleGuides: StyleGuideResponse[] | undefined;
  isLoading: boolean;
  onChange: (contentTypeId: string, settings: ContentTypeSettings) => void;
}

export const ContentTypeSettingsPanel: React.FC<ContentTypeSettingsPanelProps> = ({
  contentTypeId,
  settings,
  constants,
  styleGuides,
  isLoading,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const dialectOptions = constants?.dialects || [];
  const toneOptions = constants?.tones || [];
  const styleGuideOptions = styleGuides || [];

  const hasSettings = !!(settings.styleGuide || settings.dialect || settings.tone);

  // Use shared format utilities
  const formatTone = capitalize;

  const handleStyleGuideChange = (value: string) => {
    onChange(contentTypeId, { ...settings, styleGuide: value || null });
  };

  const handleDialectChange = (value: string) => {
    onChange(contentTypeId, { ...settings, dialect: value || null });
  };

  const handleToneChange = (value: string) => {
    onChange(contentTypeId, { ...settings, tone: value || null });
  };

  return (
    <PanelWrapper>
      <PanelHeader
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
      >
        <PanelTitle>
          Set defaults
          {hasSettings && " (configured)"}
        </PanelTitle>
        <IconButton
          aria-label={isExpanded ? "Collapse settings" : "Expand settings"}
          icon={isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
          variant="transparent"
          size="small"
        />
      </PanelHeader>

      <PanelContent $isExpanded={isExpanded}>
        <SettingsRow>
          {/* Style Guide */}
          <SettingsGroup>
            <SettingsLabel>Style Guide:</SettingsLabel>
            <CompactSelect
              value={isLoading ? "" : settings.styleGuide || DEFAULTS.styleGuide}
              onChange={(e) => {
                handleStyleGuideChange(e.target.value);
              }}
              size="small"
              isDisabled={isLoading || !styleGuideOptions.length}
            >
              {isLoading ? (
                <Select.Option value="">Loading...</Select.Option>
              ) : (
                styleGuideOptions.map((sg) => (
                  <Select.Option key={sg.id} value={sg.id}>
                    {sg.name}
                  </Select.Option>
                ))
              )}
            </CompactSelect>
          </SettingsGroup>

          {/* Dialect */}
          <SettingsGroup>
            <SettingsLabel>Dialect:</SettingsLabel>
            <CompactSelect
              value={isLoading ? "" : settings.dialect || DEFAULTS.dialect}
              onChange={(e) => {
                handleDialectChange(e.target.value);
              }}
              size="small"
              isDisabled={isLoading || !dialectOptions.length}
            >
              {isLoading ? (
                <Select.Option value="">Loading...</Select.Option>
              ) : (
                dialectOptions.map((d) => (
                  <Select.Option key={d} value={d}>
                    {formatDialect(d)}
                  </Select.Option>
                ))
              )}
            </CompactSelect>
          </SettingsGroup>

          {/* Tone */}
          <SettingsGroup>
            <SettingsLabel>Tone:</SettingsLabel>
            <CompactSelect
              value={settings.tone || ""}
              onChange={(e) => {
                handleToneChange(e.target.value);
              }}
              size="small"
              isDisabled={isLoading}
            >
              {isLoading ? (
                <Select.Option value="">Loading...</Select.Option>
              ) : (
                <>
                  <Select.Option value="">None</Select.Option>
                  {toneOptions.map((t) => (
                    <Select.Option key={t} value={t}>
                      {formatTone(t)}
                    </Select.Option>
                  ))}
                </>
              )}
            </CompactSelect>
          </SettingsGroup>
        </SettingsRow>
      </PanelContent>
    </PanelWrapper>
  );
};

export default ContentTypeSettingsPanel;
