import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSDK } from "@contentful/react-apps-toolkit";
import { AppExtensionSDK } from "@contentful/app-sdk";
import {
  Accordion,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Form,
  FormControl,
  Heading,
  Note,
  Paragraph,
  SectionHeading,
  Select,
  Switch,
  TextInput,
} from "@contentful/f36-components";

import type {
  AppConfig,
  CmaContentTypeLike,
  CmaGetManyResponseLike,
  TreeSourceConfig,
} from "../core/types";
import { DEFAULT_CONFIG } from "../config/defaults";
import { normalizeBaseUrl } from "../config/normalize";

type ContentType = {
  sys: { id: string };
  name: string;
  fields: Array<{ id: string; name: string; type: string }>;
};

const isShortText = (f: { type: string }) => f.type === "Symbol";

function normalizeRoutePrefix(prefix?: string) {
  const v = (prefix ?? "").trim();
  if (!v || v === "/") return "";
  // ensure starts with "/" and no trailing slash
  const withLeading = v.startsWith("/") ? v : `/${v}`;
  return withLeading.replace(/\/+$/, "");
}

function validate(cfg: AppConfig): string[] {
  const errors: string[] = [];

  if (!cfg.baseUrl || !/^https?:\/\//i.test(cfg.baseUrl)) {
    errors.push("Base URL is required and must start with http:// or https://");
  }

  if (!cfg.sources?.length) errors.push("Add at least one Content Type source.");

  const seen = new Set<string>();
  for (const [i, s] of (cfg.sources ?? []).entries()) {
    if (!s.contentTypeId) errors.push(`Source #${i + 1}: content type is required.`);
    if (!s.pathFieldId) errors.push(`Source #${i + 1}: path/slug field is required.`);

    if (s.contentTypeId) {
      if (seen.has(s.contentTypeId)) errors.push(`Duplicate content type: ${s.contentTypeId}`);
      seen.add(s.contentTypeId);
    }

    if (s.routePrefix) {
      if (!s.routePrefix.trim().startsWith("/")) {
        errors.push(`Source #${i + 1}: route prefix must start with "/".`);
      }
      if (/\s/.test(s.routePrefix)) {
        errors.push(`Source #${i + 1}: route prefix cannot contain spaces.`);
      }
    }
  }

  return errors;
}

function reindexAccordionStateAfterRemove(state: Record<number, boolean>, removedIdx: number) {
  const next: Record<number, boolean> = {};
  Object.entries(state).forEach(([k, v]) => {
    const idx = Number(k);
    if (idx === removedIdx) return;
    next[idx > removedIdx ? idx - 1 : idx] = v;
  });
  return next;
}

export default function ConfigScreen() {
  const sdk = useSDK<AppExtensionSDK>();

  const [loading, setLoading] = useState(true);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [errors, setErrors] = useState<string[]>([]);

  // UI state for accordions (controlled)
  const [accordionState, setAccordionState] = useState<Record<number, boolean>>({
    0: true,
  });

  // Keep latest config in a ref so onConfigure always sees the current value
  const configRef = useRef<AppConfig>(config);
  useEffect(() => {
    configRef.current = config;
    setErrors(validate(config));
  }, [config]);

  // Load once
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const params = (await sdk.app.getParameters()) as Partial<AppConfig> | null;

      const initial: AppConfig = {
        ...DEFAULT_CONFIG,
        ...(params ?? {}),
        baseUrl: normalizeBaseUrl((params?.baseUrl ?? DEFAULT_CONFIG.baseUrl) as string),
        detectOrphans: params?.detectOrphans !== false,
        sources: (params?.sources ?? DEFAULT_CONFIG.sources ?? []).map((s) => ({
          ...s,
          routePrefix: normalizeRoutePrefix(s.routePrefix),
        })),
      };

      const ctRes = (await sdk.cma.contentType.getMany({
        query: { limit: 1000 },
      })) as CmaGetManyResponseLike<CmaContentTypeLike>;

      const cts: ContentType[] = (ctRes.items ?? []).map((ct) => ({
        sys: { id: ct.sys.id },
        name: ct.name,
        fields: (ct.fields ?? []).map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
        })),
      }));

      if (!mounted) return;
      setConfig(initial);
      setContentTypes(cts);

      // register save hook ONCE
      sdk.app.onConfigure(() => {
        const current = configRef.current;

        const normalized: AppConfig = {
          ...current,
          baseUrl: normalizeBaseUrl(current.baseUrl),
          sources: (current.sources ?? []).map((s) => ({
            ...s,
            routePrefix: normalizeRoutePrefix(s.routePrefix),
          })),
        };

        const v = validate(normalized);
        setErrors(v);
        if (v.length) return false;
        return { parameters: normalized };
      });

      sdk.app.setReady();
      setLoading(false);
    }

    load().catch((e: unknown) => {
      if (!mounted) return;
      const message = e instanceof Error ? e.message : "Failed to load configuration.";
      setErrors([message]);
      setLoading(false);
      sdk.app.setReady();
    });

    return () => {
      mounted = false;
    };
  }, [sdk]);

  const ctOptions = useMemo(() => {
    return [...contentTypes]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((ct) => ({ value: ct.sys.id, label: `${ct.name} (${ct.sys.id})` }));
  }, [contentTypes]);

  const getFieldsForCt = (ctId: string) =>
    contentTypes.find((x) => x.sys.id === ctId)?.fields ?? [];

  const updateSource = (idx: number, patch: Partial<TreeSourceConfig>) => {
    setConfig((prev) => {
      const sources = [...(prev.sources ?? [])];
      sources[idx] = { ...sources[idx], ...patch };
      return { ...prev, sources };
    });
  };

  const addSource = () => {
    setConfig((prev) => ({
      ...prev,
      sources: [
        ...(prev.sources ?? []),
        {
          contentTypeId: "",
          pathFieldId: "slug",
          titleFieldId: "title",
          routePrefix: "",
        },
      ],
    }));
  };

  const removeSource = (idx: number) => {
    setConfig((prev) => {
      const sources = [...(prev.sources ?? [])];
      sources.splice(idx, 1);
      return { ...prev, sources };
    });
  };

  if (loading) {
    return (
      <Box padding="spacingL">
        <SectionHeading>PageTree</SectionHeading>
        <Paragraph>Loading configuration…</Paragraph>
      </Box>
    );
  }

  return (
    <Box padding="spacingL">
      <Flex justifyContent="center">
        <Box style={{ width: "100%", maxWidth: 960 }}>
          <Card padding="large">
            <SectionHeading>PageTree</SectionHeading>

            <Paragraph>
              Configure which content types appear in the sitemap and which field provides the URL
              segment (slug) or an absolute path.
            </Paragraph>

            {errors.length > 0 && (
              <Note variant="negative" title="Fix configuration issues">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Note>
            )}

            <Form>
              {/* Base URL */}
              <FormControl isRequired>
                <FormControl.Label>Base URL</FormControl.Label>
                <FormControl.HelpText>
                  Used for “Open preview” links. Example: https://www.example.com
                </FormControl.HelpText>
                <TextInput
                  name="baseUrl"
                  value={config.baseUrl}
                  onChange={(e) => setConfig((p) => ({ ...p, baseUrl: e.target.value }))}
                  placeholder="https://www.example.com"
                />
              </FormControl>

              {/* Locale */}
              <FormControl marginTop="spacingM">
                <FormControl.Label>Locale</FormControl.Label>
                <Select
                  value={config.locale}
                  onChange={(e) => setConfig((p) => ({ ...p, locale: e.target.value }))}
                >
                  <Select.Option value="en-US">en-US</Select.Option>
                </Select>
              </FormControl>

              {/* Detect orphaned pages */}
              <FormControl marginTop="spacingM">
                <Switch
                  id="detectOrphans"
                  isChecked={config.detectOrphans !== false}
                  onChange={() =>
                    setConfig((p) => ({
                      ...p,
                      detectOrphans: p.detectOrphans === false,
                    }))
                  }
                >
                  Detect orphaned pages
                </Switch>
                <FormControl.HelpText>
                  Flags pages whose parent URL has no entry and entries with an empty path field.
                  Turn off if your implementation intentionally uses orphan records.
                </FormControl.HelpText>
              </FormControl>

              {/* Content types */}
              <Box>
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading as="h2" marginBottom="none">
                    Content types
                  </Heading>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      const nextIdx = config.sources?.length ?? 0; // new index after add
                      addSource();
                      setAccordionState((prev) => ({
                        ...prev,
                        [nextIdx]: true,
                      }));
                    }}
                  >
                    Add content type
                  </Button>
                </Flex>

                <Box marginTop="spacingM">
                  <Accordion>
                    {(config.sources ?? []).map((s, idx) => {
                      const ctName =
                        contentTypes.find((ct) => ct.sys.id === s.contentTypeId)?.name ?? "";

                      const shortTextFields = getFieldsForCt(s.contentTypeId).filter(isShortText);

                      const needsSetup = !s.contentTypeId || !s.pathFieldId || false;

                      const title = (
                        <Flex alignItems="center" gap="spacingS">
                          <span>
                            {s.contentTypeId
                              ? `Source #${idx + 1} — ${ctName || s.contentTypeId}`
                              : `Source #${idx + 1}`}
                          </span>
                          {needsSetup && (
                            <Badge variant="warning" size="small">
                              Needs setup
                            </Badge>
                          )}
                        </Flex>
                      );

                      return (
                        <Accordion.Item
                          key={`${s.contentTypeId}-${idx}`}
                          title={title}
                          titleElement="h3"
                          isExpanded={!!accordionState[idx]}
                          onExpand={() =>
                            setAccordionState((prev) => ({
                              ...prev,
                              [idx]: true,
                            }))
                          }
                          onCollapse={() =>
                            setAccordionState((prev) => ({
                              ...prev,
                              [idx]: false,
                            }))
                          }
                        >
                          <Box marginTop="spacingS">
                            <Flex justifyContent="flex-end">
                              <Button
                                variant="negative"
                                size="small"
                                onClick={() => {
                                  removeSource(idx);
                                  setAccordionState((prev) =>
                                    reindexAccordionStateAfterRemove(prev, idx),
                                  );
                                }}
                              >
                                Remove
                              </Button>
                            </Flex>

                            <Box marginTop="spacingM">
                              <FormControl isRequired>
                                <FormControl.Label>Content type</FormControl.Label>
                                <Select
                                  value={s.contentTypeId}
                                  onChange={(e) =>
                                    updateSource(idx, {
                                      contentTypeId: e.target.value,
                                    })
                                  }
                                >
                                  <Select.Option value="">Select…</Select.Option>
                                  {ctOptions.map((opt) => (
                                    <Select.Option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </FormControl>

                              <FormControl marginTop="spacingS">
                                <FormControl.Label>Route prefix</FormControl.Label>
                                <FormControl.HelpText>
                                  Optional mount path between Base URL and the slug. Example: /news
                                  or /events. Leave blank for root.
                                </FormControl.HelpText>
                                <TextInput
                                  value={s.routePrefix ?? ""}
                                  placeholder="/news"
                                  isDisabled={!s.contentTypeId}
                                  onChange={(e) =>
                                    updateSource(idx, {
                                      routePrefix: e.target.value,
                                    })
                                  }
                                />
                              </FormControl>

                              <FormControl isRequired marginTop="spacingS">
                                <FormControl.Label>Slug / Path field</FormControl.Label>
                                <FormControl.HelpText>
                                  Prefer a relative slug (e.g. women-in-engineering). If the field
                                  value starts with “/”, it will be treated as an absolute path and
                                  route prefix will be ignored.
                                </FormControl.HelpText>
                                <Select
                                  value={s.pathFieldId}
                                  isDisabled={!s.contentTypeId}
                                  onChange={(e) =>
                                    updateSource(idx, {
                                      pathFieldId: e.target.value,
                                    })
                                  }
                                >
                                  <Select.Option value="">Select…</Select.Option>
                                  {shortTextFields.map((f) => (
                                    <Select.Option key={f.id} value={f.id}>
                                      {f.name} ({f.id})
                                    </Select.Option>
                                  ))}
                                </Select>
                              </FormControl>

                              <FormControl marginTop="spacingS">
                                <FormControl.Label>Title field (optional)</FormControl.Label>
                                <Select
                                  value={s.titleFieldId ?? ""}
                                  isDisabled={!s.contentTypeId}
                                  onChange={(e) =>
                                    updateSource(idx, {
                                      titleFieldId: e.target.value || undefined,
                                    })
                                  }
                                >
                                  <Select.Option value="">(Use last path segment)</Select.Option>
                                  {shortTextFields.map((f) => (
                                    <Select.Option key={f.id} value={f.id}>
                                      {f.name} ({f.id})
                                    </Select.Option>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          </Box>
                        </Accordion.Item>
                      );
                    })}
                  </Accordion>
                </Box>
              </Box>
            </Form>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
}
