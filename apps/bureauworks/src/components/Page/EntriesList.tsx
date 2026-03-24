import React, { useState, useEffect } from 'react';

import { ContentEntitySys, ContentType, PageAppSDK } from '@contentful/app-sdk';
import { Grid, TextLink, Box, Badge, DateTime, Table, Tooltip, Checkbox, EntityList, EntityListItem, HelpText, Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface SortTest {
  column: any;
  direction: any;
}

function getEntryStatus(entrySys: ContentEntitySys) {
  if (!!entrySys.archivedVersion) {
    return 'archived';
  } else if (!!entrySys.publishedVersion && entrySys.version === entrySys.publishedVersion + 1) {
    return 'published';
  } else if (!!entrySys.publishedVersion && entrySys.version >= entrySys.publishedVersion + 2) {
    return 'changed';
  }
  return 'draft';
}

interface EntriesListProps {
  entries: any;
  contentTypes: ContentType[];
  onClickItem: (entryId: string) => void;
  onSelected: (entryID: string | string[]) => void;
  selectedItems: string[];
  expandedItems?: Record<string, any[]>;
  onExpand?: (entryId: string) => Promise<void>;
  hideCheckbox?: boolean;
  selectedReferences: string[];
  onSelectedReferences: (referenceIds: string | string[]) => void;
  isCreateProject?: boolean;
}

const ENTRIES_LIMIT = 50;

export default function EntriesList({
  contentTypes,
  entries,
  onClickItem,
  onSelected,
  selectedItems,
  expandedItems = {},
  onExpand,
  hideCheckbox,
  selectedReferences,
  onSelectedReferences,
  isCreateProject,
}: EntriesListProps) {
  const sdk = useSDK<PageAppSDK>();
  const defaultLocale = sdk.locales.default;
  const [checkboxState, setCheckboxState] = useState(false);
  
  useEffect(() => {
    const allSelectedOnPage = entries.every((entry: any) => selectedItems.includes(entry.sys.id));
    setCheckboxState(allSelectedOnPage || selectedItems.length === ENTRIES_LIMIT);
  }, [entries, selectedItems]);

  const selectAll = (val: boolean) => {
    const entryIdsOnCurrentPage = entries.map((entry: any) => entry.sys.id);
    if (val) {
      const combinedSelectedIds = Array.from(new Set([...selectedItems, ...entryIdsOnCurrentPage]));
      if (combinedSelectedIds.length > ENTRIES_LIMIT) {
        onSelected(combinedSelectedIds.slice(0, ENTRIES_LIMIT));
      } else {
        onSelected(combinedSelectedIds);
      }
    } else {
      const filteredSelectedIds = selectedItems.filter((id) => !entryIdsOnCurrentPage.includes(id));
      onSelected(filteredSelectedIds);
    }
    setCheckboxState(val);
  };
  
  // Loading state.
  if (!entries) {
    return (
      <Box marginTop="spacingM">
        <EntityList>
          {Array(3)
            .fill('')
            .map((_, i) => (
              <EntityListItem key={i} title="loading" className="entity-loading" isLoading />
            ))}
        </EntityList>
      </Box>
    );
  }

  if (entries.length) {
    return (
      <Grid style={{ width: '100%' }}>
        <br></br>
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Cell>
                {!hideCheckbox ? (
                  <Checkbox
                    style={{ marginLeft: '5px', marginBottom: '2px', marginTop: '2px' }}
                    name="checkbox-select-all"
                    id="checkbox-select-all"
                    isChecked={checkboxState}
                    onChange={() => selectAll(!checkboxState)}
                  />
                ) : null}
              </Table.Cell>
              <Table.Cell>Name</Table.Cell>
              {isCreateProject ? (
                <Table.Cell>References</Table.Cell>
              ) : (
                <Table.Cell style={{ visibility: 'hidden' }} />
              )}
              <Table.Cell>Content Type</Table.Cell>
              <Table.Cell>Updated</Table.Cell>
              <Table.Cell>Status</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {entries.map((entry: any) => {
              const contentType =
                contentTypes.length &&
                contentTypes.find((ct) => ct.sys.id === entry.sys.contentType.sys.id);
              const entryStatus = getEntryStatus(entry.sys);

              return (
                <>
                  <Table.Row key={entry.sys.id}>
                    <Table.Cell>
                      {!hideCheckbox ? (
                        <Checkbox
                          style={{ marginLeft: '5px' }}
                          name={`checkbox-${entry.sys.id}`}
                          id={`checkbox-${entry.sys.id}`}
                          key={`checkbox-${entry.sys.id}`}
                          isChecked={selectedItems.includes(entry.sys.id)}
                          onChange={() => onSelected(entry.sys.id)}
                        />
                      ) : null}
                    </Table.Cell>
                    <Table.Cell onClick={() => onClickItem(entry.sys.id)}>
                      <Tooltip
                        placement="top"
                        id="tooltip-entry-title"
                        content="Click here to open the entry in the slide-in bar on the right side of the page"
                        showDelay={1000}
                      >
                        <TextLink>
                          {(contentType && entry.fields[contentType.displayField]?.[defaultLocale]) || 'Untitled'}
                        </TextLink>
                      </Tooltip>
                    </Table.Cell>
                    <Table.Cell>
                      {onExpand && isCreateProject && (
                        <Button size="small" onClick={() => onExpand(entry.sys.id)}>
                          {expandedItems[entry.sys.id] ? 'Hide References' : 'Show References'}
                        </Button>
                      )}
                    </Table.Cell>
                    <Table.Cell>{contentType ? contentType.name : entry.sys.contentType.type}</Table.Cell>
                    <Table.Cell>{<DateTime date={entry.sys.updatedAt} />}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant={
                          entryStatus === 'published'
                            ? 'positive'
                            : entryStatus === 'changed'
                            ? 'primary'
                            : 'warning'
                        }
                      >
                        {entryStatus}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                  {expandedItems[entry.sys.id] && (
                    <Table.Row key={`${entry.sys.id}-expanded`}>
                      <Table.Cell colSpan={6}>
                        <Box padding="spacingM">
                          {expandedItems[entry.sys.id] && expandedItems[entry.sys.id].length > 0 && (
                            <Checkbox
                              name={`checkbox-select-all-refs-${entry.sys.id}`}
                              id={`checkbox-select-all-refs-${entry.sys.id}`}
                              isChecked={expandedItems[entry.sys.id]?.every((ref) =>
                                selectedReferences.includes(ref.sys.id)
                              )}
                              onChange={(e) => {
                                const referenceIds = expandedItems[entry.sys.id]?.map((ref) => ref.sys.id) || [];
                                const updatedSelectedReferences = e.target.checked
                                  ? Array.from(new Set([...selectedReferences, ...referenceIds]))
                                  : selectedReferences.filter((id) => !referenceIds.includes(id));
                                onSelectedReferences(updatedSelectedReferences);
                              }}
                            >
                              {expandedItems[entry.sys.id]?.every((ref) => 
                                selectedReferences.includes(ref.sys.id)
                              )
                                ? 'Deselect All'
                                : 'Select All'}
                            </Checkbox>
                          )}
                          <Box
                            style={{
                              maxHeight: '200px',
                              overflowY: 'auto',
                              padding: '8px',
                            }}
                          >
                            {expandedItems[entry.sys.id]?.length > 0 ? (
                              expandedItems[entry.sys.id]?.map((ref) => (
                                <Box
                                  key={ref.sys.id}
                                  style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}
                                >
                                  <Checkbox
                                    name={`checkbox-ref-${ref.sys.id}`}
                                    id={`checkbox-ref-${ref.sys.id}`}
                                    isChecked={selectedReferences.includes(ref.sys.id)}
                                    onChange={() => onSelectedReferences(ref.sys.id)}
                                    style={{ marginRight: '10px' }}
                                  />
                                  <TextLink onClick={() => onClickItem(ref.sys.id)}>
                                    {(contentType && ref.fields[contentType.displayField]?.[defaultLocale]) || 'Untitled'}
                                  </TextLink>
                                </Box>
                              ))
                            ) : (
                              <HelpText>No references found for this entry.</HelpText>
                            )}
                          </Box>
                        </Box>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </>
              );
            })}
          </Table.Body>
        </Table>
      </Grid>
    );
  }

  return (
    <Box marginTop="spacingM">
      <HelpText>No entries found.</HelpText>
    </Box>
  );
}
