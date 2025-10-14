import React, { useEffect, useMemo, useState } from 'react';
import { Paragraph, Select, FormControl, Note, Spinner, Button, Text } from '@contentful/f36-components';
import styled from '@emotion/styled';
import { useApiService } from '../../hooks/useApiService';
import { DEFAULTS } from '../../utils/userSettings';

const Wrapper = styled.div`
  padding: 5px;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 3px;
`;

type StyleSettingsProps = {
  apiKey: string;
  dialect: string | null;
  tone: string | null;
  styleGuide: string | null;
  onDialectChange: (value: string | null) => void;
  onToneChange: (value: string | null) => void;
  onStyleGuideChange: (value: string | null) => void;
  onSaveAndClose?: () => void;
};

export const StyleSettings: React.FC<StyleSettingsProps> = ({
  apiKey,
  dialect,
  tone,
  styleGuide,
  onDialectChange,
  onToneChange,
  onStyleGuideChange,
  onSaveAndClose,
}) => {
  const config = { apiKey };
  const { constants, styleGuides, constantsLoading, styleGuidesLoading, constantsError, styleGuidesError } =
    useApiService(config);

  const dialectOptions = useMemo(() => constants?.dialects ?? [], [constants]);
  const toneOptions = useMemo(() => constants?.tones ?? [], [constants]);
  const styleGuideOptions = useMemo(() => styleGuides ?? [], [styleGuides]);
  const [showErrors, setShowErrors] = useState(false);

  const loading = constantsLoading || styleGuidesLoading;
  const error = constantsError || styleGuidesError;

  // Ensure a default style guide is selected once options are loaded
  useEffect(() => {
    if (!styleGuideOptions || styleGuideOptions.length === 0) return;

    // If current value matches an option exactly, do nothing
    if (styleGuide && styleGuideOptions.some((sg) => sg.id === styleGuide)) return;

    const preferred =
      styleGuideOptions.find((sg) => sg.id.toLowerCase() === DEFAULTS.styleGuide) ||
      styleGuideOptions.find((sg) => sg.name?.toLowerCase() === DEFAULTS.styleGuide);

    if (preferred) {
      onStyleGuideChange(preferred.id);
    }
  }, [styleGuideOptions, styleGuide, onStyleGuideChange]);

  if (loading && !constants && !styleGuides) {
    return (
      <Wrapper>
        <Spinner size="small" />
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <Note variant="negative" title="Error">
          {error.message}
        </Note>
      </Wrapper>
    );
  }

  if (!constants || !styleGuides) {
    return (
      <Wrapper>
        <Paragraph>No settings available.</Paragraph>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Controls>
        <FormControl>
          <FormControl.Label>
            Dialect{' '}
            <Text as="span" fontColor="red600">
              *
            </Text>
          </FormControl.Label>
          <Select
            value={dialect || ''}
            onChange={(e) => onDialectChange(e.target.value || null)}
            isInvalid={showErrors && !dialect}
          >
            <Select.Option value="">Select</Select.Option>
            {dialectOptions.map((d) => (
              <Select.Option key={d} value={d}>
                {d}
              </Select.Option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormControl.Label>Tone</FormControl.Label>
          <Select value={tone || ''} onChange={(e) => onToneChange(e.target.value || null)}>
            <Select.Option value="">None</Select.Option>
            {toneOptions.map((t) => (
              <Select.Option key={t} value={t}>
                {t}
              </Select.Option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormControl.Label>
            Style Guide{' '}
            <Text as="span" fontColor="red600">
              *
            </Text>
          </FormControl.Label>
          <Select
            value={styleGuide || ''}
            onChange={(e) => onStyleGuideChange(e.target.value || null)}
            isInvalid={showErrors && !styleGuide}
          >
            <Select.Option value="">Select</Select.Option>
            {styleGuideOptions.map((sg) => (
              <Select.Option key={sg.id} value={sg.id}>
                {sg.name}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
        <div style={{ marginTop: 6 }}>
          <Button
            size="small"
            onClick={() => {
              const complete = !!(dialect && styleGuide);
              if (!complete) {
                setShowErrors(true);
                return;
              }
              onSaveAndClose?.();
            }}
          >
            Save
          </Button>
        </div>
      </Controls>
    </Wrapper>
  );
};

export default StyleSettings;
