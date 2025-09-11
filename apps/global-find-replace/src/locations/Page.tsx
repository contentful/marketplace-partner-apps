import React from 'react';
import { Flex, Paragraph, Spinner, Button, FormLabel, Select, Option, Modal } from '@contentful/f36-components';
import { css } from '@emotion/css';
import { useFindReplace } from '../hooks/useFindReplace';
import { SearchForm, ResultsControls, ResultsTable, Pagination, SummaryView } from '../components';
import styles from './Page.module.css';
import { Footer } from '../components/Footer';
import { PAGE_SIZE_OPTIONS } from '../types';

const FindReplaceApp: React.FC = () => {
  const {
    state,
    updateState,
    resetState,
    updateFilters,
    handleSearch,
    handleEntrySelection,
    handleSelectAll,
    handleApplyChanges,
    anchorRef,
    totalPages,
    currentPageEntries,
    allSelected,
    selectedCount,
  } = useFindReplace();

  const { find, replace, selectedContentTypes, locale, caseSensitive, includeAllFields } = state;
  const searchFilters = { find, replace, selectedContentTypes, locale, caseSensitive, includeAllFields };

  function updatePageSize(size: number) {
    updateState({ pageSize: size, currentPage: 0 });
  }

  function showConfirmationModal() {
    updateState({ confirmationModalShown: true });
  }

  function hideConfirmationModal() {
    updateState({ confirmationModalShown: false });
  }

  function applyChanges() {
    hideConfirmationModal();
    handleApplyChanges();
  }

  if (state.showSummary) {
    return <SummaryView appliedChanges={state.appliedChanges} publishAfterUpdate={state.publishAfterUpdate} onBackToSearch={() => resetState()} />;
  }

  return (
    <Flex flexDirection="column" className={styles.pageContainer}>
      {/* Scrollable Content Area (Top 80%) */}
      <Flex flexDirection="column" padding="spacingL" className={styles.main}>
        <Flex flexDirection="column" gap="spacingS" alignItems="center" marginBottom="spacingL">
          <h1 className={styles.heading}>
            Global Find & Replace by{' '}
            <a href="https://ellavationlabs.com/" target="_blank">
              Ellavation Labs
            </a>
          </h1>
          <Paragraph
            className={css({
              fontSize: '1rem',
            })}>
            Search once, replace everywhere instantly
          </Paragraph>
        </Flex>

        <span style={{ marginBottom: '2rem' }}>
          <SearchForm
            filters={searchFilters}
            contentTypes={state.contentTypes}
            locales={state.locales}
            searching={state.searching}
            contentTypeDropdownOpen={state.contentTypeDropdownOpen}
            onFiltersChange={updateFilters}
            onSearch={handleSearch}
            onContentTypeDropdownToggle={() => updateState({ contentTypeDropdownOpen: !state.contentTypeDropdownOpen })}
            onContentTypeDropdownClose={() => updateState({ contentTypeDropdownOpen: false })}
            anchorRef={anchorRef}
          />
        </span>

        {state.searching && (
          <Flex
            justifyContent="center"
            alignItems="center"
            className={css({
              padding: '2rem',
              minHeight: '200px',
              marginTop: '5rem',
            })}>
            <Flex flexDirection="column" alignItems="center" gap="spacingM">
              <Spinner size="large" />
              <Paragraph>Searching for matches...</Paragraph>
            </Flex>
          </Flex>
        )}

        {!state.searching && state.fields.length === 0 && state.resultsLoaded && (
          <Flex
            justifyContent="center"
            alignItems="center"
            className={css({
              padding: '2rem',
              minHeight: '200px',
              textAlign: 'center',
            })}>
            <Flex flexDirection="column" alignItems="center" gap="spacingS">
              <Paragraph className={css({ fontSize: '1.2rem', fontWeight: 'bold' })}>No results found</Paragraph>
              <Paragraph className={css({ color: '#666' })}>Try adjusting your search term or content type filters</Paragraph>
            </Flex>
          </Flex>
        )}

        {!state.searching && state.fields.length > 0 && (
          <>
            <ResultsControls
              resultCount={state.fields.length}
              publishAfterUpdate={state.publishAfterUpdate}
              selectedCount={selectedCount}
              applyingChanges={state.applyingChanges}
              formModifiedSinceSearch={state.formModifiedSinceSearch}
              onPublishToggleChange={(publishAfterUpdate) => updateState({ publishAfterUpdate })}
              onApplyChanges={showConfirmationModal}
            />

            <ResultsTable
              entries={currentPageEntries}
              selectedEntries={state.selectedEntries}
              allSelected={allSelected}
              isLoading={state.applyingChanges}
              spaceId={state.spaceId}
              selectedCount={selectedCount}
              processedCount={state.processedCount}
              environment={state.environment}
              onEntrySelectionChange={handleEntrySelection}
              onSelectAllChange={handleSelectAll}
            />

            {!state.applyingChanges && (
              <div className={styles.bottomControlsContainer}>
                <div className={styles.bottomLeft}>
                  <Flex style={{ maxWidth: '300px' }}>
                    <Flex alignItems="center">
                      <FormLabel htmlFor="pageSize" style={{ marginBottom: 0 }}>
                        Items per page:
                      </FormLabel>
                    </Flex>
                    <Select
                      id="pageSize"
                      value={state.pageSize.toString()}
                      onChange={(e) => updatePageSize(parseInt(e.target.value))}
                      style={{ marginLeft: '1rem' }}>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <Option key={size} value={size.toString()}>
                          {size}
                        </Option>
                      ))}
                    </Select>
                  </Flex>
                </div>
                <Pagination currentPage={state.currentPage} totalPages={totalPages} onPageChange={(currentPage) => updateState({ currentPage })} />
              </div>
            )}
          </>
        )}
      </Flex>
      <Modal onClose={() => hideConfirmationModal()} isShown={state.confirmationModalShown}>
        {() => (
          <>
            <Modal.Header title="Apply Changes Confirmation" onClose={() => hideConfirmationModal()} />
            <Modal.Content>
              <Paragraph>Are you sure you want to apply these changes? This action cannot be undone.</Paragraph>
            </Modal.Content>
            <Modal.Controls>
              <Button variant="transparent" size="small" onClick={() => hideConfirmationModal()}>
                Close
              </Button>
              <Button variant="positive" size="small" onClick={() => applyChanges()}>
                Confirm
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>

      <div className={styles.footer}>
        <Footer></Footer>
      </div>
    </Flex>
  );
};

export default FindReplaceApp;
