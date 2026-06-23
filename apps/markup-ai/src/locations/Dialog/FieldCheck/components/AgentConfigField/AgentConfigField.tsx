import React from "react";
import { FormControl, Select, TextInput } from "@contentful/f36-components";
import { AGENT_CONFIG_KEY_META } from "../../../../../agents/agents";
import type { StyleGuideSummaryResponse } from "../../../../../api-client/types.gen";
import { useStyleGuides } from "../../../../../hooks/useStyleGuides";

function toCsvString(value: unknown): string {
  if (Array.isArray(value)) return (value as string[]).join(", ");
  if (typeof value === "string") return value;
  return "";
}

export interface AgentConfigFieldProps {
  /** Config key (e.g. "style_guide_id", "domain_ids"). */
  configKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
  isDisabled?: boolean;
  /** API key — only used when prefetched style guides are not provided. */
  apiKey?: string | null;
  /** Pre-fetched style guides. Passing these avoids a duplicate `/style-agent/style-guides` call. */
  styleGuides?: StyleGuideSummaryResponse[];
  styleGuidesLoading?: boolean;
  styleGuidesError?: boolean;
}

/**
 * Renders a single agent-config key with the Forma 36 control appropriate for its
 * declared `inputType`. New config keys only need an entry in `AGENT_CONFIG_KEY_META`
 * — the settings panel renders them automatically.
 */
export const AgentConfigField: React.FC<AgentConfigFieldProps> = ({
  configKey,
  value,
  onChange,
  isDisabled,
  apiKey,
  styleGuides,
  styleGuidesLoading,
  styleGuidesError,
}) => {
  const meta = AGENT_CONFIG_KEY_META[configKey];
  if (!meta) return null;

  if (meta.inputType === "style_guide_select") {
    return (
      <StyleGuideSelectField
        configKey={configKey}
        meta={meta}
        value={value}
        onChange={onChange}
        isDisabled={isDisabled}
        apiKey={apiKey}
        prefetchedStyleGuides={styleGuides}
        prefetchedLoading={styleGuidesLoading}
        prefetchedError={styleGuidesError}
      />
    );
  }

  if (meta.inputType === "csv") {
    const stringValue = toCsvString(value);
    return (
      <FormControl isRequired={meta.required}>
        <FormControl.Label>{meta.label}</FormControl.Label>
        <TextInput
          value={stringValue}
          placeholder={meta.placeholder}
          isDisabled={isDisabled}
          onChange={(e) => {
            const arr = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            onChange(arr);
          }}
        />
        <FormControl.HelpText>Comma-separated values.</FormControl.HelpText>
      </FormControl>
    );
  }

  // domain_select / text — free-text fallback for v1.
  const stringValue = typeof value === "string" ? value : "";
  return (
    <FormControl isRequired={meta.required}>
      <FormControl.Label>{meta.label}</FormControl.Label>
      <TextInput
        value={stringValue}
        placeholder={meta.placeholder}
        isDisabled={isDisabled}
        onChange={(e) => {
          onChange(e.target.value || undefined);
        }}
      />
    </FormControl>
  );
};

interface StyleGuideSelectFieldProps {
  configKey: string;
  meta: NonNullable<(typeof AGENT_CONFIG_KEY_META)[string]>;
  value: unknown;
  onChange: (value: unknown) => void;
  isDisabled?: boolean;
  apiKey?: string | null;
  /** When provided, skip the local fetch and use these instead. */
  prefetchedStyleGuides?: StyleGuideSummaryResponse[];
  prefetchedLoading?: boolean;
  prefetchedError?: boolean;
}

/**
 * Style-guide picker. When the parent passes `prefetchedStyleGuides`, we reuse
 * them instead of firing another `/style-agent/style-guides` request — that's how
 * the dialog ensures a single network call is shared between the header
 * picker and this control.
 */
const StyleGuideSelectField: React.FC<StyleGuideSelectFieldProps> = ({
  configKey,
  meta,
  value,
  onChange,
  isDisabled,
  apiKey,
  prefetchedStyleGuides,
  prefetchedLoading,
  prefetchedError,
}) => {
  const fallback = useStyleGuides(prefetchedStyleGuides ? null : apiKey);
  const styleGuides = prefetchedStyleGuides ?? fallback.styleGuides;
  const isLoading = prefetchedStyleGuides ? Boolean(prefetchedLoading) : fallback.isLoading;
  const isError = prefetchedStyleGuides ? Boolean(prefetchedError) : fallback.isError;

  const stringValue = typeof value === "string" ? value : "";
  const enabledStyleGuides = styleGuides.filter((g) => g.enabled);
  const hasOptions = enabledStyleGuides.length > 0;
  const valueIsKnown = !stringValue || enabledStyleGuides.some((g) => g.id === stringValue);

  let helpText: string | undefined;
  if (isError) helpText = "Failed to load style guides.";
  else if (!isLoading && !hasOptions) helpText = "No style guides available for this account.";

  return (
    <FormControl isRequired={meta.required} isInvalid={isError}>
      <FormControl.Label>{meta.label}</FormControl.Label>
      <Select
        id={`agent-config-${configKey}`}
        value={stringValue}
        isDisabled={isDisabled || isLoading || !hasOptions}
        onChange={(e) => {
          onChange(e.target.value || undefined);
        }}
      >
        {isLoading && <Select.Option value="">Loading…</Select.Option>}
        {!isLoading && !hasOptions && <Select.Option value="">No style guides</Select.Option>}
        {!isLoading && hasOptions && !stringValue && (
          <Select.Option value="">{meta.placeholder}</Select.Option>
        )}
        {!isLoading && !valueIsKnown && stringValue && (
          <Select.Option value={stringValue}>Saved style guide (unavailable)</Select.Option>
        )}
        {enabledStyleGuides.map((styleGuide) => (
          <Select.Option key={styleGuide.id} value={styleGuide.id}>
            {styleGuide.display_name}
            {styleGuide.is_default ? " (default)" : ""}
          </Select.Option>
        ))}
      </Select>
      {helpText && <FormControl.HelpText>{helpText}</FormControl.HelpText>}
    </FormControl>
  );
};
