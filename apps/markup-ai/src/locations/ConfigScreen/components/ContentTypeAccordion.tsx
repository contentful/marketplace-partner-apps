/**
 * ContentTypeAccordion - Accordion-style content type selector with check-all functionality
 * Only one content type can be expanded at a time
 */

import React from "react";
import { Checkbox, Select, Button } from "@contentful/f36-components";
import { CaretDownIcon, CaretRightIcon, LockSimpleIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import type { ContentTypeSettings } from "../../../types/appConfig";
import type { ConstantsResponse, StyleGuideResponse } from "../../../api-client/types.gen";
import { formatDialectShort, capitalize } from "../../Dialog/FieldCheck/utils/format";
import { DEFAULTS } from "../../../utils/userSettings";

const AccordionItem = styled.div`
  border: 1px solid ${tokens.gray200};
  border-radius: ${tokens.borderRadiusMedium};
  margin-bottom: ${tokens.spacingS};
  overflow: hidden;
  background: ${tokens.colorWhite};

  &:last-child {
    margin-bottom: 0;
  }
`;

const AccordionHeader = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  padding: ${tokens.spacingS} ${tokens.spacingM};
  background: ${({ $isExpanded }) => ($isExpanded ? tokens.gray100 : tokens.colorWhite)};
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;

  &:hover {
    background: ${tokens.gray100};
  }
`;

const ExpandIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${tokens.spacingS};
  color: ${tokens.gray500};
`;

const HeaderContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${tokens.spacingM};
`;

const ContentTypeName = styled.span`
  font-family: ${tokens.fontStackPrimary};
  font-weight: ${tokens.fontWeightDemiBold};
  font-size: ${tokens.fontSizeM};
  color: ${tokens.gray800};
`;

const FieldCount = styled.span`
  font-family: ${tokens.fontStackPrimary};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray500};
`;

const AccordionBody = styled.div<{ $isExpanded: boolean }>`
  display: ${({ $isExpanded }) => ($isExpanded ? "block" : "none")};
  padding: ${tokens.spacingM};
  border-top: 1px solid ${tokens.gray200};
  background: ${tokens.gray100};
`;

const FieldsSection = styled.div`
  margin-bottom: ${tokens.spacingM};
`;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  padding: ${tokens.spacingXs} 0 ${tokens.spacingXs} ${tokens.spacingL};
`;

const FieldLabel = styled.span`
  font-family: ${tokens.fontStackPrimary};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};
`;

const FieldType = styled.span`
  font-family: ${tokens.fontStackPrimary};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray500};
  background: ${tokens.gray200};
  padding: ${tokens.spacing2Xs} ${tokens.spacingXs};
  border-radius: ${tokens.borderRadiusSmall};
  margin-left: ${tokens.spacingXs};
`;

const SettingsSection = styled.div`
  padding: ${tokens.spacingM};
  background: ${tokens.colorWhite};
  border-radius: ${tokens.borderRadiusMedium};
  border: 1px solid ${tokens.gray200};
`;

const SettingsTitle = styled.div`
  font-family: ${tokens.fontStackPrimary};
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray600};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${tokens.spacingS};
`;

const SettingsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingM};
  flex-wrap: nowrap;
`;

const SettingsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};
  flex-shrink: 0;
`;

const SettingsLabel = styled.label`
  font-family: ${tokens.fontStackPrimary};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};
  white-space: nowrap;
`;

const StyledSelect = styled(Select)`
  width: 140px;
  min-width: 140px;
  max-width: 140px;

  & select {
    font-size: ${tokens.fontSizeS};
    padding: ${tokens.spacing2Xs} ${tokens.spacingXs};
    height: 28px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;

const CheckAllRow = styled.div`
  display: flex;
  align-items: center;
  padding: ${tokens.spacingXs} 0;
  border-bottom: 1px dashed ${tokens.gray300};
  margin-bottom: ${tokens.spacingXs};
`;

const LockedSettingsSection = styled.div`
  padding: ${tokens.spacingM};
  background: ${tokens.gray100};
  border-radius: ${tokens.borderRadiusMedium};
  border: 1px dashed ${tokens.gray300};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spacingM};
`;

const LockedMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingS};
`;

const LockIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${tokens.gray200};
  border-radius: 50%;
  color: ${tokens.gray500};
`;

const LockedText = styled.div`
  font-family: ${tokens.fontStackPrimary};
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray600};
  line-height: ${tokens.lineHeightS};
`;

const LockedTitle = styled.span`
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray700};
  display: block;
`;

interface FieldInfo {
  id: string;
  name: string;
  type: string;
  isChecked: boolean;
}

interface ContentTypeAccordionProps {
  contentTypeId: string;
  contentTypeName: string;
  fields: FieldInfo[];
  isExpanded: boolean;
  isAuthenticated: boolean;
  settings: ContentTypeSettings;
  constants: ConstantsResponse | undefined;
  styleGuides: StyleGuideResponse[] | undefined;
  isLoading: boolean;
  onToggleExpand: (contentTypeId: string) => void;
  onFieldChange: (fieldId: string, contentTypeId: string) => void;
  onCheckAll: (contentTypeId: string, checked: boolean) => void;
  onSettingsChange: (contentTypeId: string, settings: ContentTypeSettings) => void;
  onSignIn?: () => void;
}

export const ContentTypeAccordion: React.FC<ContentTypeAccordionProps> = ({
  contentTypeId,
  contentTypeName,
  fields,
  isExpanded,
  isAuthenticated,
  settings,
  constants,
  styleGuides,
  isLoading,
  onToggleExpand,
  onFieldChange,
  onCheckAll,
  onSettingsChange,
  onSignIn,
}) => {
  const checkedCount = fields.filter((f) => f.isChecked).length;
  const allChecked = checkedCount === fields.length;
  const someChecked = checkedCount > 0 && checkedCount < fields.length;

  const dialectOptions = constants?.dialects || [];
  const toneOptions = constants?.tones || [];
  const styleGuideOptions = styleGuides || [];

  // Use shared format utilities
  const formatDialect = formatDialectShort;
  const formatTone = capitalize;

  return (
    <AccordionItem>
      <AccordionHeader
        $isExpanded={isExpanded}
        onClick={() => {
          onToggleExpand(contentTypeId);
        }}
      >
        <ExpandIcon>
          {isExpanded ? <CaretDownIcon size="small" /> : <CaretRightIcon size="small" />}
        </ExpandIcon>
        <HeaderContent>
          <ContentTypeName>{contentTypeName}</ContentTypeName>
          <FieldCount>
            {checkedCount} of {fields.length} selected
          </FieldCount>
        </HeaderContent>
      </AccordionHeader>

      <AccordionBody $isExpanded={isExpanded}>
        <FieldsSection>
          <CheckAllRow>
            <Checkbox
              id={`${contentTypeId}-all`}
              isChecked={allChecked}
              isIndeterminate={someChecked}
              onChange={() => {
                onCheckAll(contentTypeId, !allChecked);
              }}
            >
              <FieldLabel style={{ fontWeight: 500 }}>Select all fields</FieldLabel>
            </Checkbox>
          </CheckAllRow>

          {fields.map((field) => (
            <FieldRow key={`${contentTypeId}-${field.id}`}>
              <Checkbox
                id={`${contentTypeId}-${field.id}`}
                isChecked={field.isChecked}
                onChange={() => {
                  onFieldChange(field.id, contentTypeId);
                }}
              >
                <FieldLabel>{field.name}</FieldLabel>
                <FieldType>{field.type}</FieldType>
              </Checkbox>
            </FieldRow>
          ))}
        </FieldsSection>

        {isAuthenticated ? (
          <SettingsSection>
            <SettingsTitle>Default Settings</SettingsTitle>
            <SettingsRow>
              <SettingsGroup>
                <SettingsLabel>Style Guide:</SettingsLabel>
                <StyledSelect
                  value={isLoading ? "" : settings.styleGuide || DEFAULTS.styleGuide}
                  onChange={(e) => {
                    onSettingsChange(contentTypeId, {
                      ...settings,
                      styleGuide: e.target.value || null,
                    });
                  }}
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
                </StyledSelect>
              </SettingsGroup>

              <SettingsGroup>
                <SettingsLabel>Dialect:</SettingsLabel>
                <StyledSelect
                  value={isLoading ? "" : settings.dialect || DEFAULTS.dialect}
                  onChange={(e) => {
                    onSettingsChange(contentTypeId, {
                      ...settings,
                      dialect: e.target.value || null,
                    });
                  }}
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
                </StyledSelect>
              </SettingsGroup>

              <SettingsGroup>
                <SettingsLabel>Tone:</SettingsLabel>
                <StyledSelect
                  value={settings.tone || ""}
                  onChange={(e) => {
                    onSettingsChange(contentTypeId, {
                      ...settings,
                      tone: e.target.value || null,
                    });
                  }}
                  isDisabled={isLoading}
                >
                  <Select.Option value="">None</Select.Option>
                  {toneOptions.map((t) => (
                    <Select.Option key={t} value={t}>
                      {formatTone(t)}
                    </Select.Option>
                  ))}
                </StyledSelect>
              </SettingsGroup>
            </SettingsRow>
          </SettingsSection>
        ) : (
          <LockedSettingsSection>
            <LockedMessage>
              <LockIconWrapper>
                <LockSimpleIcon size="small" />
              </LockIconWrapper>
              <LockedText>
                <LockedTitle>Default Settings</LockedTitle>
                Set style guide, dialect, and tone defaults for this content type
              </LockedText>
            </LockedMessage>
            {onSignIn && (
              <Button variant="secondary" size="small" onClick={onSignIn}>
                Sign in to unlock
              </Button>
            )}
          </LockedSettingsSection>
        )}
      </AccordionBody>
    </AccordionItem>
  );
};

export default ContentTypeAccordion;
