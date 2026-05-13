import React from "react";
import { FormControl, Select, TextInput } from "@contentful/f36-components";
import { AGENT_CONFIG_KEY_META } from "../../../../../agents/agents";
import type { TargetResponse } from "../../../../../api-client/types.gen";
import { useStyleTargets } from "../../../../../hooks/useStyleTargets";

function toCsvString(value: unknown): string {
  if (Array.isArray(value)) return (value as string[]).join(", ");
  if (typeof value === "string") return value;
  return "";
}

export interface AgentConfigFieldProps {
  /** Config key (e.g. "target_id", "domain_ids"). */
  configKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
  isDisabled?: boolean;
  /** API key — only used when prefetched targets are not provided. */
  apiKey?: string | null;
  /** Pre-fetched style guide targets. Passing these avoids a duplicate `/style-agent/targets` call. */
  styleGuideTargets?: TargetResponse[];
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
  styleGuideTargets,
  styleGuidesLoading,
  styleGuidesError,
}) => {
  const meta = AGENT_CONFIG_KEY_META[configKey];
  if (!meta) return null;

  if (meta.inputType === "target_select") {
    return (
      <TargetSelectField
        configKey={configKey}
        meta={meta}
        value={value}
        onChange={onChange}
        isDisabled={isDisabled}
        apiKey={apiKey}
        prefetchedTargets={styleGuideTargets}
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

interface TargetSelectFieldProps {
  configKey: string;
  meta: NonNullable<(typeof AGENT_CONFIG_KEY_META)[string]>;
  value: unknown;
  onChange: (value: unknown) => void;
  isDisabled?: boolean;
  apiKey?: string | null;
  /** When provided, skip the local fetch and use these instead. */
  prefetchedTargets?: TargetResponse[];
  prefetchedLoading?: boolean;
  prefetchedError?: boolean;
}

/**
 * Style-guide picker. When the parent passes `prefetchedTargets`, we reuse
 * them instead of firing another `/style-agent/targets` request — that's how
 * the dialog ensures a single network call is shared between the header
 * picker and this control.
 */
const TargetSelectField: React.FC<TargetSelectFieldProps> = ({
  configKey,
  meta,
  value,
  onChange,
  isDisabled,
  apiKey,
  prefetchedTargets,
  prefetchedLoading,
  prefetchedError,
}) => {
  const fallback = useStyleTargets(prefetchedTargets ? null : apiKey);
  const targets = prefetchedTargets ?? fallback.targets;
  const isLoading = prefetchedTargets ? Boolean(prefetchedLoading) : fallback.isLoading;
  const isError = prefetchedTargets ? Boolean(prefetchedError) : fallback.isError;

  const stringValue = typeof value === "string" ? value : "";
  const enabledTargets = targets.filter((t) => t.enabled);
  const hasOptions = enabledTargets.length > 0;
  const valueIsKnown = !stringValue || enabledTargets.some((t) => t.id === stringValue);

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
        {enabledTargets.map((target) => (
          <Select.Option key={target.id} value={target.id}>
            {target.display_name}
            {target.is_default ? " (default)" : ""}
          </Select.Option>
        ))}
      </Select>
      {helpText && <FormControl.HelpText>{helpText}</FormControl.HelpText>}
    </FormControl>
  );
};
