import React, { useEffect, useRef, useState } from 'react';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { Button, Flex, List, Modal, Note, SectionHeading, Text, Tooltip } from '@contentful/f36-components';
import { css } from '@emotion/css';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import type { KeyValueMap } from 'contentful-management';

import { CloudUploadIcon, DeleteIcon, DownloadIcon, EditIcon, InfoCircleIcon, ListBulletedIcon, ReferencesIcon } from '@contentful/f36-icons';
import { type Rule } from '../types/Rule';
import {
  buildExportPayload,
  getContentTypeName,
  getFieldName,
  mergeRules,
  parseImportedConfig,
  validateImportedRules,
  type ImportValidationResult,
} from '../utils';

// CSS constants for repeated styles
const HIGHLIGHTED_TEXT_STYLE = css({
  color: '#444',
  borderBottom: '1px dashed #333',
  fontWeight: 'bold',
});

/**
 * Parse a Contentful URN to extract space, environment, and entity IDs
 * Format: crn:contentful:::content:spaces/<space-id>/environments/<env-id>/entries/<entry-id>
 */
function parseUrn(urn: string): {
  spaceId: string;
  environmentId: string;
  entityId: string;
  entityType: 'entries' | 'assets';
} | null {
  const match = urn.match(/crn:contentful:::content:spaces\/([^/]+)\/environments\/([^/]+)\/(entries|assets)\/([^/]+)/);

  if (!match) {
    return null;
  }

  return {
    spaceId: match[1],
    environmentId: match[2],
    entityType: match[3] as 'entries' | 'assets',
    entityId: match[4],
  };
}

interface RulesListProps {
  rules: Rule[];
  ruleToEditIndex?: number;
  setRuleToEditIndex: React.Dispatch<React.SetStateAction<number | undefined>>;
  deleteRule: (rule: Rule) => void;
  onImportRules?: (rules: Rule[]) => void;
}

const RulesList = (props: RulesListProps) => {
  const [allContentTypes, setAllContentTypes] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [entryNames, setEntryNames] = useState<Record<string, string>>({});

  const handleWindowResize = () => {
    setWindowWidth(window.innerWidth);
  };

  const cma = useCMA();
  const sdk = useSDK<ConfigAppSDK>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportValidationResult | null>(null);

  // Download the current rules as a JSON file.
  const handleExport = () => {
    const rules: Rule[] = props.rules || [];

    if (!rules.length) {
      sdk.notifier.warning('There are no rules to export.');
      return;
    }

    try {
      const payload = buildExportPayload(rules);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;

      link.href = url;
      link.download = `flexfields-config-${spaceId}-${environmentId}-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      sdk.notifier.success(`Exported ${rules.length} rule${rules.length === 1 ? '' : 's'}.`);
    } catch (error) {
      sdk.notifier.error('Failed to export configuration.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Read the selected file, parse it, validate against existing content types,
  // and open the override/merge confirmation dialog.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file again still triggers a change event.
    event.target.value = '';

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const rules = parseImportedConfig(String(reader.result ?? ''));

        if (!rules.length) {
          sdk.notifier.warning('The selected file does not contain any rules.');
          return;
        }

        const result = validateImportedRules(rules, allContentTypes);

        if (!result.validRules.length) {
          sdk.notifier.error('None of the rules in the file reference existing content types or fields.');
        }

        setImportResult(result);
      } catch (error) {
        sdk.notifier.error(error instanceof Error ? error.message : 'Failed to read configuration file.');
      }
    };

    reader.onerror = () => {
      sdk.notifier.error('Failed to read the selected file.');
    };

    reader.readAsText(file);
  };

  // Apply the validated import either by overriding or merging with existing rules.
  const applyImport = (mode: 'override' | 'merge') => {
    if (!importResult) return;

    const validRules = importResult.validRules;
    const newRules = mode === 'override' ? validRules : mergeRules(props.rules || [], validRules);

    props.onImportRules?.(newRules);
    setImportResult(null);

    sdk.notifier.success(`Imported ${validRules.length} rule${validRules.length === 1 ? '' : 's'} (${mode === 'override' ? 'replaced existing' : 'merged'}).`);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchContentTypes = async () => {
      try {
        const response = await cma.contentType.getMany({});
        if (!isMounted) {
          return;
        }

        setAllContentTypes(response.items);
      } catch (error) {
        sdk.notifier.error('Unable to load content types for rule summaries.');
      }
    };

    fetchContentTypes();

    return () => {
      isMounted = false;
    };
  }, [cma, sdk.notifier]);

  // Fetch entry names for all linkedEntryIds in rules
  useEffect(() => {
    const fetchEntryNames = async () => {
      // Collect all entry/asset IDs from rules with their type
      const itemsToFetch: Record<
        string,
        {
          type: 'entry' | 'asset' | 'resource';
          spaceId?: string;
          environmentId?: string;
        }
      > = {};

      props.rules?.forEach((rule: Rule) => {
        const itemIds = rule.linkedEntryIds || (rule.linkedEntryId ? [rule.linkedEntryId] : []);
        const isAsset = rule.condition === 'includes asset';

        itemIds.forEach((id) => {
          // Check if this is a URN (cross-space reference)
          if (typeof id === 'string' && id.startsWith('crn:contentful')) {
            const urnInfo = parseUrn(id);
            if (urnInfo) {
              itemsToFetch[id] = {
                type: 'resource',
                spaceId: urnInfo.spaceId,
                environmentId: urnInfo.environmentId,
              };
            }
          } else {
            // Regular entry/asset in current space
            itemsToFetch[id] = {
              type: isAsset ? 'asset' : 'entry',
            };
          }
        });
      });

      // Fetch entries/assets
      const names: Record<string, string> = {};

      for (const [id, info] of Object.entries(itemsToFetch)) {
        if (info.type === 'resource') {
          // Handle cross-space resource references
          try {
            const urnInfo = parseUrn(id);
            if (!urnInfo) {
              names[id] = id;
              continue;
            }

            const entityType = urnInfo.entityType === 'entries' ? 'Entry' : 'Asset';
            const truncatedId = urnInfo.entityId.substring(0, 8);
            names[id] = `External ${entityType} (${truncatedId}...)`;
          } catch (error) {
            names[id] = id;
          }
        } else if (info.type === 'asset') {
          // Fetch asset from current space
          try {
            const asset = await cma.asset.get({ assetId: id });
            const fields: KeyValueMap = asset.fields || {};

            let name = undefined;
            // For assets, try title first
            if (fields.title && typeof fields.title === 'object') {
              const locales = Object.keys(fields.title);
              if (locales.length > 0) {
                name = fields.title[locales[0]];
              }
            }

            // If no title, try fileName from file object
            if (!name && fields.file && typeof fields.file === 'object') {
              const locales = Object.keys(fields.file);
              if (locales.length > 0 && fields.file[locales[0]]?.fileName) {
                name = fields.file[locales[0]].fileName;
              }
            }

            names[id] = name || id;
          } catch (error) {
            names[id] = id;
          }
        } else {
          // Fetch entry from current space
          try {
            const entry = await cma.entry.get({ entryId: id });
            const fields = entry.fields || {};

            // Use cached content types to find the display field without an extra CMA call per entry.
            const entryContentTypeId = entry.sys.contentType.sys.id;
            const entryContentType = allContentTypes.find((contentType) => contentType.sys.id === entryContentTypeId);
            const displayFieldId = entryContentType?.displayField;

            let name = undefined;
            if (displayFieldId && fields[displayFieldId]) {
              const displayFieldValue = fields[displayFieldId];
              if (typeof displayFieldValue === 'object') {
                const locales = Object.keys(displayFieldValue);
                if (locales.length > 0) {
                  name = displayFieldValue[locales[0]];
                }
              }
            }

            names[id] = name || id;
          } catch (error) {
            names[id] = id;
          }
        }
      }

      setEntryNames(names);
    };

    if (props.rules?.length > 0) {
      fetchEntryNames();
    }
  }, [props.rules, cma, allContentTypes]);

  useEffect(() => {
    // Add event listener for window resize
    window.addEventListener('resize', handleWindowResize);

    // Cleanup: remove event listener when component unmounts
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  return (
    <div>
      <Flex
        alignItems="center"
        justifyContent="space-between"
        gap="8px"
        className={css({
          margin: '1rem 0 0',
          maxWidth: `${windowWidth > 1550 ? '65vw' : '100vw'}`,
        })}>
        <Flex alignItems="center" gap="8px">
          <ListBulletedIcon />
          <SectionHeading
            className={css({
              fontSize: '14px !important',
              margin: '0 !important',
            })}>
            Current Rules
            <span
              className={css({
                fontSize: '0.8rem',
                color: 'rgb(1, 71, 81);',
                marginLeft: '0.5rem',
              })}>
              ({props.rules.length} rule
              {props.rules.length !== 1 && 's'})
            </span>
          </SectionHeading>
        </Flex>
        <Flex gap="spacingS" alignItems="center">
          <Button variant="secondary" size="small" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export rules
          </Button>
          <Button variant="secondary" size="small" startIcon={<CloudUploadIcon />} onClick={handleImportClick}>
            Import rules
          </Button>
          <Tooltip
            placement="bottom"
            content={
              <span
                className={css({
                  display: 'block',
                  maxWidth: 320,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  textAlign: 'left',
                })}>
                Import a previously exported FlexFields configuration.
                {'\n\n'}Format: a JSON file containing a "rules" array (such as one produced by Export rules).
                {'\n\n'}Validation: each rule is checked against this environment — its content type, source field, target content type and target field(s) must
                all exist. Rules that reference anything missing are skipped, and you'll see why.
                {'\n\n'}Options: choose Override to replace all existing rules with the imported ones, or Merge to add them to your current rules (duplicates
                are skipped). Changes apply after you click Save.
              </span>
            }>
            <Flex alignItems="center" className={css({ cursor: 'help', color: '#6b7280' })} aria-label="Import configuration help" tabIndex={0}>
              <InfoCircleIcon />
            </Flex>
          </Tooltip>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileChange} className={css({ display: 'none' })} />
        </Flex>
      </Flex>

      {props.rules.length === 0 && <p className={css({ marginTop: '1rem' })}>No rules yet. Add your first!</p>}

      <Flex flexDirection="column" className={css({ maxWidth: '100vw' })}>
        <ul className={css({ paddingLeft: '0' })}>
          {props.rules.map((rule: Rule, index: number) => (
            <li
              key={index}
              className={css({
                margin: '0.5rem 0',
                listStyle: 'none',
                padding: '0.75rem 1rem',
                border: '1px solid #eee',
                borderRadius: '0.5rem',
                boxShadow: 'rgba(0, 0, 0, 0.05) 0px 3px 8px;',
                maxWidth: `${windowWidth > 1550 ? '65vw' : '100vw'}`,
                transition: 'all 0.2s ease-in-out',
                ':hover': {
                  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 3px 8px;',
                  transition: 'all 0.2s ease-in-out',
                },
                ...(index === props.ruleToEditIndex
                  ? {
                      backgroundColor: '#eee',
                    }
                  : {}),
              })}>
              <Flex alignItems="center" justifyContent="space-between">
                <Text fontSize="fontSizeM" lineHeight="lineHeightL">
                  <ReferencesIcon /> If content type{' '}
                  <span
                    className={css({
                      fontWeight: 'bold',
                      borderBottom: '1px dashed #333',
                    })}>
                    "{getContentTypeName(rule.contentType, allContentTypes) ?? rule.contentType}"
                  </span>{' '}
                  has{' '}
                  <span className={HIGHLIGHTED_TEXT_STYLE}>
                    {getFieldName([rule.contentTypeField], rule.contentType, allContentTypes).join(', ') ?? rule.contentTypeField}
                  </span>{' '}
                  which <span className={HIGHLIGHTED_TEXT_STYLE}>{rule.condition}</span> {/* Display condition values based on condition type */}
                  {rule.condition !== 'is not empty' && rule.condition !== 'is empty' && rule.condition !== 'is true' && rule.condition !== 'is false' ? (
                    <>
                      {/* Between conditions show two values */}
                      {(rule.condition === 'between' || rule.condition === 'reference count between') && (
                        <>
                          between <span className={HIGHLIGHTED_TEXT_STYLE}>{rule.conditionValueMin}</span> and{' '}
                          <span className={HIGHLIGHTED_TEXT_STYLE}>{rule.conditionValueMax}</span>
                        </>
                      )}
                      {/* Includes entry shows entry ID(s) */}
                      {(rule.condition === 'includes entry' || rule.condition === 'includes asset') && (
                        <>
                          {(() => {
                            // Support both old (linkedEntryId) and new (linkedEntryIds) format
                            const entryIds = rule.linkedEntryIds || (rule.linkedEntryId ? [rule.linkedEntryId] : []);
                            const itemType = rule.condition === 'includes asset' ? 'asset' : 'entry';
                            const itemTypePlural = rule.condition === 'includes asset' ? 'assets' : 'entries';
                            return entryIds.length === 1 ? itemType : itemTypePlural;
                          })()}{' '}
                          <span className={HIGHLIGHTED_TEXT_STYLE}>
                            "
                            {(() => {
                              const entryIds = rule.linkedEntryIds || (rule.linkedEntryId ? [rule.linkedEntryId] : []);
                              // Map IDs to names (handles both regular and URN-based IDs)
                              const names = entryIds.map((id) => entryNames[id] || id);
                              return names.join('", "');
                            })()}
                            "
                          </span>
                        </>
                      )}
                      {/* All other conditions with single value */}
                      {rule.condition !== 'between' &&
                        rule.condition !== 'reference count between' &&
                        rule.condition !== 'includes entry' &&
                        rule.condition !== 'includes asset' && (
                          <>
                            {rule.condition !== 'contains' && rule.condition !== 'includes' && 'to'}{' '}
                            <span className={HIGHLIGHTED_TEXT_STYLE}>"{rule.conditionValue}"</span>
                          </>
                        )}
                    </>
                  ) : null}{' '}
                  then in entity{' '}
                  <span className={HIGHLIGHTED_TEXT_STYLE}>
                    {/* {rule.targetEntity} */}
                    {getContentTypeName(rule.targetEntity, allContentTypes) ?? rule.contentType}
                    {rule.isForSameEntity ? ' (Same Entry)' : ''}
                  </span>{' '}
                  hide the{' '}
                  <span className={HIGHLIGHTED_TEXT_STYLE}>
                    "{getFieldName(rule.targetEntityField, rule.targetEntity, allContentTypes).join(', ') ?? rule.targetEntityField}"
                  </span>{' '}
                  field(s)
                </Text>

                <span
                  className={css({
                    minWidth: '3.4rem',
                  })}>
                  <EditIcon
                    onClick={() => {
                      if (index !== props.ruleToEditIndex) {
                        props.setRuleToEditIndex(index);
                      }
                    }}
                    className={css({
                      marginLeft: '0.5rem',
                      width: '1.2rem',
                      height: '1.2rem',
                      ...(index === props.ruleToEditIndex
                        ? {
                            fill: 'grey',
                          }
                        : {
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            ':hover': {
                              transform: 'scale(1.1)',
                            },
                          }),
                    })}
                    alt="Edit Rule"
                    aria-label="Edit Rule"
                    title="Edit Rule"
                    role="img"
                  />
                  <DeleteIcon
                    onClick={() => {
                      if (index !== props.ruleToEditIndex) {
                        props.deleteRule(rule);
                      }
                    }}
                    className={css({
                      ...(index === props.ruleToEditIndex
                        ? {
                            fill: 'grey',
                          }
                        : {
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            ':hover': {
                              fill: 'red',
                              transform: 'scale(1.1)',
                            },
                          }),
                      marginLeft: '0.5rem',
                      width: '1.2rem',
                      height: '1.2rem',
                    })}
                    alt="Delete Rule"
                    aria-label="Delete Rule"
                    title="Delete Rule"
                    role="img"
                  />
                </span>
              </Flex>
            </li>
          ))}
        </ul>
      </Flex>

      <Modal onClose={() => setImportResult(null)} isShown={!!importResult} size="large">
        {() => (
          <>
            <Modal.Header title="Import configuration" onClose={() => setImportResult(null)} />
            <Modal.Content>
              {importResult && (
                <Flex flexDirection="column" gap="spacingM">
                  <Text>
                    Found <strong>{importResult.validRules.length}</strong> valid rule
                    {importResult.validRules.length === 1 ? '' : 's'} to import. You currently have <strong>{props.rules?.length || 0}</strong> rule
                    {(props.rules?.length || 0) === 1 ? '' : 's'}.
                  </Text>

                  {importResult.invalidRules.length > 0 && (
                    <Note variant="warning" title={`${importResult.invalidRules.length} rule(s) will be skipped`}>
                      <Text>The following rules reference content types or fields that do not exist in this environment:</Text>
                      <List className={css({ marginTop: 8 })}>
                        {importResult.invalidRules.map((invalid, index) => (
                          <List.Item key={index}>{invalid.reasons.join('; ')}</List.Item>
                        ))}
                      </List>
                    </Note>
                  )}

                  <Text>
                    Choose <strong>Override</strong> to replace all existing rules with the imported ones, or <strong>Merge</strong> to add the imported rules
                    to your existing rules (duplicates are skipped).
                  </Text>

                  <Note variant="primary">
                    Imported rules are staged only. You must click <strong>Save</strong> on the configuration screen to persist them.
                  </Note>
                </Flex>
              )}
            </Modal.Content>
            <Modal.Controls>
              <Button variant="secondary" size="small" onClick={() => setImportResult(null)}>
                Cancel
              </Button>
              <Button variant="positive" size="small" isDisabled={!importResult?.validRules.length} onClick={() => applyImport('merge')}>
                Merge
              </Button>
              <Button variant="negative" size="small" isDisabled={!importResult?.validRules.length} onClick={() => applyImport('override')}>
                Override
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </div>
  );
};

export default RulesList;
