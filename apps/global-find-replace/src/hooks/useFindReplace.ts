import { useState, useEffect, useRef } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentfulService } from '../services/contentfulService';
import { AppState, MatchField, SearchFilters } from '../types';
import posthog from 'posthog-js';
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
  };

  const [state, setState] = useState<AppState>({
    ...initialAppState,
  });
  useEffect(() => {
    const initializeData = async () => {
      posthog.identify(sdk.ids.organization);
      // Capture initial pageview
      posthog.capture('$pageview', {
        page: 'Search',
      });

      const locales = contentfulService.current.getLocales();
      const contentTypes = await contentfulService.current.getContentTypes();

      setState((prev) => ({
        ...prev,
        locales,
        locale: locales[0] || '',
        contentTypes,
        spaceId: sdk.ids.space,
      }));
    };

    initializeData();
  }, []);

  // Track page view changes
  useEffect(() => {
    if (state.showSummary) {
      posthog.capture('$pageview', {
        page: 'Change Summary',
      });
    } else if (state.fields.length > 0) {
      posthog.capture('$pageview', {
        page: 'Search Results',
      });
    }
  }, [state.showSummary, state.fields.length]);

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
    }));
  };

  // Handle search
  const handleSearch = async () => {
    if (!state.find.trim()) return;

    setState((prev) => ({ ...prev, searching: true, fields: [], currentPage: 0 }));
    posthog.capture('search');

    try {
      const contentTypeIds = state.selectedContentTypes.length ? state.selectedContentTypes : state.contentTypes.map((ct) => ct.sys.id);

      const matches = await contentfulService.current.searchEntries(
        contentTypeIds,
        state.contentTypes,
        state.locale,
        state.find,
        state.replace,
        state.caseSensitive,
        state.includeAllFields,
      );

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
    } finally {
      setState((prev) => ({ ...prev, searching: false }));
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
    const selectedEntries = state.fields.filter((e) => state.selectedEntries[e.id]);
    if (selectedEntries.length === 0) return;

    setState((prev) => ({ ...prev, applyingChanges: true }));
    const applied: MatchField[] = [];

    posthog.capture('apply-changes');

    // Group selectedEntries by entryId
    const groupedUpdates = _.groupBy(selectedEntries, 'entryId');

    for (const [entryId, entryArray] of Object.entries(groupedUpdates)) {
      try {
        await contentfulService.current.updateEntry(entryArray, state.contentTypes, state.locale, state.publishAfterUpdate);
        applied.push(...entryArray);
        setState((prev) => ({ ...prev, processedCount: applied.length }));
      } catch (error) {
        console.error(`Failed to update entry ${entryId}:`, error);
      }
    }

    setState((prev) => ({
      ...prev,
      appliedChanges: applied,
      showSummary: true,
      applyingChanges: false,
    }));
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
