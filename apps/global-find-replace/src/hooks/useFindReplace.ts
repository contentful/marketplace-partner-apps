import { useState, useEffect, useRef } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentfulService } from '../services/contentfulService';
import { AppState, MatchField, SearchFilters } from '../types';
import * as Sentry from '@sentry/react';
import _ from 'lodash';

export const useFindReplace = () => {
  const sdk = useSDK<PageAppSDK>();
  const contentfulService = useRef(new ContentfulService(sdk));
  const anchorRef = useRef<HTMLButtonElement>(null);

  const initialAppState = {
    find: '',
    replace: '',
    contentTypes: [],
    selectedContentTypes: [],
    locale: '',
    locales: [],
    searching: false,
    resultsLoaded: false,
    fields: [],
    selectedEntries: {},
    publishAfterUpdate: false,
    pageSize: 20,
    currentPage: 0,
    showSummary: false,
    appliedChanges: [],
    contentTypeDropdownOpen: false,
    applyingChanges: false,
    caseSensitive: false,
    includeAllFields: false,
    formModifiedSinceSearch: false,
    spaceId: '',
    confirmationModalShown: false,
    processedCount: 0,
    environment: '',
  };

  const [state, setState] = useState<AppState>({
    ...initialAppState,
  });
  useEffect(() => {
    const initializeData = async () => {
      const locales = contentfulService.current.getLocales();
      const contentTypes = await contentfulService.current.getContentTypes();

      setState((prev) => ({
        ...prev,
        locales,
        locale: locales[0] || '',
        contentTypes,
        spaceId: sdk.ids.space,
        environment: sdk.ids.environment,
      }));
    };

    initializeData();
  }, []);

  // Update search filters
  const updateFilters = (filters: Partial<SearchFilters>) => {
    setState((prev) => ({
      ...prev,
      ...filters,
      formModifiedSinceSearch: prev.fields.length > 0, // Only set to true if there are search results
    }));
  };

  // Update state
  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    setState((prev) => ({
      ...initialAppState,
      contentTypes: prev.contentTypes,
      locales: prev.locales,
      locale: prev.locale,
      spaceId: prev.spaceId,
      environment: prev.environment,
    }));
  };

  // Handle search
  const handleSearch = async () => {
    if (!state.find.trim()) return;

    setState((prev) => ({ ...prev, searching: true, fields: [], currentPage: 0 }));
    const sentrySpan = Sentry.startInactiveSpan({
      name: 'ui.search',
      op: 'ui.action',
    });

    try {
      const contentTypeIds = state.selectedContentTypes.length ? state.selectedContentTypes : state.contentTypes.map((ct) => ct.sys.id);

      sentrySpan.setAttributes({
        'search.contentTypeIds': contentTypeIds,
        'search.locale': state.locale,
        'search.find': state.find,
        'search.replace': state.replace,
        'search.caseSensitive': state.caseSensitive,
        'search.searchAllFields': state.includeAllFields,
        'search.spaceId': state.spaceId,
      });

      const matches = await contentfulService.current.searchEntries({
        contentTypeIds: contentTypeIds,
        contentTypes: state.contentTypes,
        locale: state.locale,
        find: state.find,
        replace: state.replace,
        caseSensitive: state.caseSensitive,
        searchAllFields: state.includeAllFields,
      });

      const initialSelection = matches.reduce(
        (acc, item) => {
          acc[item.id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setState((prev) => ({
        ...prev,
        fields: matches,
        selectedEntries: initialSelection,
        formModifiedSinceSearch: false, // Reset the flag after successful search
        resultsLoaded: true,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      sentrySpan.recordException(error);
      sentrySpan.setStatus({ code: 2 });
      throw error;
    } finally {
      setState((prev) => ({ ...prev, searching: false }));
      sentrySpan.end();
    }
  };

  // Handle entry selection
  const handleEntrySelection = (entryId: string) => {
    setState((prev) => ({
      ...prev,
      selectedEntries: {
        ...prev.selectedEntries,
        [entryId]: !prev.selectedEntries[entryId],
      },
    }));
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    const updated = state.fields.reduce(
      (acc, entry) => {
        acc[entry.id] = checked;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    setState((prev) => ({ ...prev, selectedEntries: updated }));
  };

  // Handle apply changes
  const handleApplyChanges = async () => {
    const sentrySpan = Sentry.startInactiveSpan({
      name: 'ui.apply',
      op: 'ui.action',
    });

    const selectedEntries = state.fields.filter((e) => state.selectedEntries[e.id]);
    if (selectedEntries.length === 0) return;

    setState((prev) => ({ ...prev, applyingChanges: true }));
    const applied: MatchField[] = [];

    // Group selectedEntries by entryId
    const groupedUpdates = _.groupBy(selectedEntries, 'entryId');

    sentrySpan.setAttributes({
      'apply.fieldCount': selectedEntries.length,
      'apply.entryCount': Object.keys(groupedUpdates).length,
      'search.spaceId': state.spaceId,
    });

    for (const [entryId, entryArray] of Object.entries(groupedUpdates)) {
      try {
        const result = await contentfulService.current.applyEntryUpdates(entryArray, state.contentTypes, state.locale, state.publishAfterUpdate);
        entryArray.forEach((e) => {
          e.updateSuccess = result.updateSuccess;
          e.publishSuccess = result.publishSuccess;
          e.errorMessage = result.errorMessage;
        });
        applied.push(...entryArray);
        setState((prev) => ({ ...prev, processedCount: applied.length }));
      } catch (error) {
        console.error(`Failed to update entry ${entryId}:`, error);
        sentrySpan.recordException(error);
        sentrySpan.setStatus({ code: 2 });
        entryArray.forEach((e) => {
          e.updateSuccess = false;
          e.errorMessage = 'err message';
        });
      }
    }

    setState((prev) => ({
      ...prev,
      appliedChanges: applied,
      showSummary: true,
      applyingChanges: false,
    }));

    sentrySpan.end();
  };

  // Computed values
  const totalPages = Math.ceil(state.fields.length / state.pageSize);
  const sortedEntries = [...state.fields].sort((a, b) => {
    const byContentType = a.contentType.localeCompare(b.contentType);
    if (byContentType !== 0) return byContentType;

    const byField = a.field.localeCompare(b.field);
    if (byField !== 0) return byField;

    const nameA = a.name?.toLowerCase?.() || a.entryId;
    const nameB = b.name?.toLowerCase?.() || b.entryId;
    return nameA.localeCompare(nameB);
  });

  const currentPageEntries = sortedEntries.slice(state.currentPage * state.pageSize, (state.currentPage + 1) * state.pageSize);

  const allSelected = state.fields.length > 0 && state.fields.every((entry) => state.selectedEntries[entry.id]);
  const selectedCount = state.fields.filter((entry) => state.selectedEntries[entry.id]).length;

  return {
    state,
    updateState,
    resetState,
    updateFilters,
    handleSearch,
    handleEntrySelection,
    handleSelectAll,
    handleApplyChanges,
    anchorRef,
    // Computed values
    totalPages,
    currentPageEntries,
    allSelected,
    selectedCount,
  };
};
