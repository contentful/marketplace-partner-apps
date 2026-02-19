/**
 * Configuration panel - horizontal bar for dialect, tone, and style guide
 * Collapsible - shows summary when collapsed, full controls when expanded
 */

import React, { useState } from "react";
import { Select, Collapse, IconButton } from "@contentful/f36-components";
import { GearSixIcon, CaretDownIcon, CaretUpIcon } from "@contentful/f36-icons";
import type { ConfigValues } from "../../hooks/useFieldCheckState";
import type { ConstantsResponse, StyleGuideResponse } from "../../../../../api-client/types.gen";
import { formatDialect, formatTone } from "../../utils/format";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";

export interface ConfigPanelProps {
  value: ConfigValues;
  onChange: (newConfig: Partial<ConfigValues>) => void;
  constants?: ConstantsResponse;
  styleGuides?: StyleGuideResponse[];
}

const ConfigContainer = styled.div`
  background: ${tokens.colorWhite};
  border: 1px solid ${tokens.gray300};
  border-radius: ${tokens.borderRadiusMedium};
  overflow: hidden;
`;

const ConfigHeader = styled.div<{ isExpanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${tokens.spacingXs} ${tokens.spacingM};
  background: ${(props) => (props.isExpanded ? tokens.gray100 : tokens.colorWhite)};
  cursor: pointer;
  transition: background-color 0.15s ease;
  min-height: 40px;

  &:hover {
    background: ${tokens.gray100};
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingS};
  flex: 1;
`;

const ConfigIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${tokens.gray600};
`;

const ConfigSummary = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingM};
  flex: 1;
  flex-wrap: wrap;
`;

const SummaryItem = styled.span`
  font-size: ${tokens.fontSizeS};
  color: ${tokens.gray700};
  display: flex;
  align-items: center;
  gap: ${tokens.spacingXs};

  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${tokens.gray400};
  }

  &:first-of-type::before {
    display: none;
  }
`;

const ConfigFields = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${tokens.spacingM};
  padding: ${tokens.spacingM};
  background: ${tokens.colorWhite};
  border-top: 1px solid ${tokens.gray200};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: ${tokens.spacingS};
  }
`;

const ConfigField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingXs};
`;

const ConfigLabel = styled.label`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray700};

  .required {
    color: ${tokens.red600};
  }
`;

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  value,
  onChange,
  constants,
  styleGuides,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build options from API data
  const dialectOptions = (constants?.dialects || []).map((d) => ({
    value: d,
    label: formatDialect(d) || d,
  }));

  const toneOptions = [
    { value: "", label: "None" },
    ...(constants?.tones || []).map((t) => ({
      value: t,
      label: formatTone(t) || t,
    })),
  ];

  const styleGuideOptions = (styleGuides || []).map((sg) => ({
    value: sg.id,
    label: sg.name,
  }));

  const selectedDialect = value.dialect || (dialectOptions[0]?.value ?? "");
  const selectedTone = value.tone || "";
  const selectedStyleGuide = value.styleGuide || styleGuideOptions[0]?.value || "";

  // Get display labels for collapsed state
  const dialectLabel = dialectOptions.find((d) => d.value === selectedDialect)?.label || "Not set";
  const toneLabel = toneOptions.find((t) => t.value === (selectedTone as string))?.label || "None";
  const styleGuideLabel =
    styleGuideOptions.find((sg) => sg.value === selectedStyleGuide)?.label || "Not set";

  const handleDialectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ dialect: e.target.value as ConfigValues["dialect"] });
  };

  const handleToneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const toneValue = e.target.value || null;
    onChange({ tone: toneValue as ConfigValues["tone"] });
  };

  const handleStyleGuideChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ styleGuide: e.target.value });
  };

  return (
    <ConfigContainer>
      <ConfigHeader
        isExpanded={isExpanded}
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
      >
        <HeaderContent>
          <ConfigIcon>
            <GearSixIcon size="small" />
          </ConfigIcon>
          <ConfigSummary>
            <SummaryItem>{styleGuideLabel}</SummaryItem>
            <SummaryItem>{dialectLabel}</SummaryItem>
            {selectedTone && <SummaryItem>{toneLabel}</SummaryItem>}
          </ConfigSummary>
        </HeaderContent>
        <IconButton
          aria-label={isExpanded ? "Collapse config" : "Expand config"}
          icon={isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
          variant="transparent"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        />
      </ConfigHeader>

      <Collapse isExpanded={isExpanded}>
        <ConfigFields>
          <ConfigField>
            <ConfigLabel htmlFor="style-guide-select">
              Style Guide <span className="required">*</span>
            </ConfigLabel>
            <Select
              id="style-guide-select"
              value={selectedStyleGuide}
              onChange={handleStyleGuideChange}
              size="small"
            >
              {styleGuideOptions.map((sg) => (
                <Select.Option key={sg.value} value={sg.value}>
                  {sg.label}
                </Select.Option>
              ))}
            </Select>
          </ConfigField>

          <ConfigField>
            <ConfigLabel htmlFor="dialect-select">
              Dialect <span className="required">*</span>
            </ConfigLabel>
            <Select
              id="dialect-select"
              value={selectedDialect}
              onChange={handleDialectChange}
              size="small"
            >
              {dialectOptions.map((d) => (
                <Select.Option key={d.value} value={d.value}>
                  {d.label}
                </Select.Option>
              ))}
            </Select>
          </ConfigField>

          <ConfigField>
            <ConfigLabel htmlFor="tone-select">Tone</ConfigLabel>
            <Select id="tone-select" value={selectedTone} onChange={handleToneChange} size="small">
              {toneOptions.map((t) => (
                <Select.Option key={t.value} value={t.value}>
                  {t.label}
                </Select.Option>
              ))}
            </Select>
          </ConfigField>
        </ConfigFields>
      </Collapse>
    </ConfigContainer>
  );
};
