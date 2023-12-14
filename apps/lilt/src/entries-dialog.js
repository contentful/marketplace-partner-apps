import React from 'react';
import PropTypes from 'prop-types';
import { Button, Stack, Heading } from '@contentful/f36-components';

import { PRE_SUBMISSION_STATUSES } from './constants';
import EntryTableLoading from './entry-table-loading';
import EntryTable from './entry-table';
import SearchBar from './search-bar';
import ReleaseMultiSelect from './release-multi-select';
import CMClient from './contentful-management-client';
import { SubmittedContentWarning, UnsearchableTitle } from './warnings';

/**
 * @typedef {object} Props
 * @prop {import('contentful-ui-extensions-sdk').KnownSDK} sdk
 * @extends {React.Component<Props>}
 */
class EntriesDialog extends React.Component {
  cmClient;

  constructor(props) {
    super(props);
    const { sdk } = props;
    this.state = {
      releases: [],
      selectedReleases: [],
      allEntries: [],
      entries: [],
      selectedEntriesIds: [],
      isLoading: true,
      defaultLocale: sdk.locales.default,
      showUnsearchableWarning: false
    };

    this.cmClient = new CMClient(sdk);
  }

  async componentDidMount() {
    const { sdk } = this.props;
    const { entryId } = sdk.parameters.invocation;

    const { items: releases } = await this.cmClient.getReleasesByEntryId(entryId);

    if (!releases || !releases.length) {
      await sdk.dialogs.openAlert({
        title: 'You do not have any releases!',
        message: 'You must have at least one release to use this feature.'
      });
      return this.handleClose();
    }

    this.setState({ releases });

    if (releases.length === 1) {
      const selectedReleases = [releases[0]];
      const entriesIds = releases[0].entities.items.map(({ sys }) => sys.id);
      const allEntries = await this.getEntries(entriesIds);

      this.setState({
        allEntries,
        entries: allEntries,
        selectedReleases
      });
    }

    this.setState({ isLoading: false });
  }

  handleSubmit = async () => {
    const noOfSelected = this.state.selectedEntriesIds.length;
    if (noOfSelected === 0) {
      return this.props.sdk.dialogs.openAlert({
        title: 'You have not selected any entries!',
        message: 'Please select at least one entry to send for localization.'
      });
    }
    const { selectedEntriesIds, allEntries } = this.state;
    const selectedEntries = allEntries.filter(entry => selectedEntriesIds.includes(entry.sys.id));
    const isSubmittedSelected = selectedEntries.some(this.isSubmitted);
    this.props.sdk.close({ selectedEntries, isSubmittedSelected });
  };

  handleClose = () => {
    this.props.sdk.close();
  };

  handleCheckboxChange = id => {
    this.setState(({ selectedEntriesIds: prevSelected }) => {
      const exists = prevSelected.includes(id);
      const selectedEntriesIds = exists
        ? prevSelected.filter(sId => sId !== id)
        : prevSelected.concat(id);
      return { selectedEntriesIds };
    });
  };

  handleChangeAll = () => {
    this.setState(({ selectedEntriesIds: prevSelected, entries }) => {
      const noOfEntries = entries.length;
      const areAllSelected = prevSelected.length === noOfEntries;
      const selectedEntriesIds = areAllSelected ? [] : entries.map(({ sys: { id } }) => id);
      return { selectedEntriesIds };
    });
  };

  handleSearch = searchQuery => {
    this.setState(({ allEntries }) => {
      const entries = searchQuery
        ? allEntries.filter(this.filterSelectableEntries(searchQuery))
        : allEntries;
      return { entries };
    });
  };

  handleClearSearch = () => {
    const { allEntries } = this.state;
    this.setState({ entries: allEntries });
  };

  handleReleasesSelected = async selectedReleases => {
    if (!selectedReleases || !selectedReleases.length) {
      return this.handleClose();
    }

    this.setState({ isLoading: true });

    const entriesIds = selectedReleases.reduce((acc, { entities }) => {
      const ids = entities.items.map(({ sys: { id } }) => id);
      return acc.concat(...ids);
    }, []);
    const allEntries = await this.getEntries(entriesIds);

    this.setState({ entries: allEntries, allEntries, selectedReleases, isLoading: false });
  };

  handleDeselectSent = () => {
    this.setState(({ selectedEntriesIds: prevSelected, entries }) => {
      const selectedEntriesIds = prevSelected.filter(id => {
        const entry = entries.find(entry => entry.sys.id === id);
        return !this.isSubmitted(entry);
      });
      return { selectedEntriesIds };
    });
  };

  /**
   * fetches entries, their content types and attaches
   * the `displayField` of the content type to the
   * corresponding entry
   * @param {string[]} entriesIds
   * @returns entries with displayField property
   */
  getEntries = async entriesIds => {
    const allRawEntries = await this.cmClient.getEntriesByIDs(entriesIds);
    const allContentTypeIds = allRawEntries.map(({ sys }) => sys.contentType.sys.id);
    // remove duplicates
    const contentTypeIds = [...new Set(allContentTypeIds)];
    const contentTypes = await this.cmClient.getContentTypesByIDs(contentTypeIds);
    const allEntries = allRawEntries.map(entry => {
      const contentType = contentTypes.find(({ sys }) => sys.id === entry.sys.contentType.sys.id);
      entry.displayField = contentType ? contentType.displayField : 'title';
      entry.isSubmitted = this.isSubmitted(entry);
      return entry;
    });
    return allEntries;
  };

  dismissUnsearchableWarning = () => {
    this.setState({ showUnsearchableWarning: false });
  };

  render() {
    const { releases, entries, selectedEntriesIds, isLoading, selectedReleases } = this.state;

    if (isLoading) {
      return (
        <section className="entry-selector-dialog-wrapper">
          <EntryTableLoading />
        </section>
      );
    }

    const showReleaseSelector = !selectedReleases || !selectedReleases.length;

    if (showReleaseSelector) {
      return (
        <section className="dialog-wrapper">
          <ReleaseMultiSelect
            title="Select Releases"
            searchPlaceholder="Search for releases by title"
            onSelect={this.handleReleasesSelected}
            items={releases}
          />
        </section>
      );
    }

    const showWarning = () => {
      if (selectedEntriesIds.length === 0) {
        return false;
      }

      return selectedEntriesIds.some(id => {
        const entry = entries.find(entry => entry.sys.id === id);
        return this.isSubmitted(entry);
      });
    };
    const areAllSelected = entries.length === selectedEntriesIds.length;

    return (
      <section className="entry-selector-dialog-wrapper">
        <Heading margin="none">Select Entries</Heading>
        <SubmittedContentWarning isVisible={showWarning()} onAction={this.handleDeselectSent} />
        <UnsearchableTitle
          isVisible={this.state.showUnsearchableWarning}
          onDismiss={this.dismissUnsearchableWarning}
        />
        <SearchBar
          onChange={this.handleSearch}
          onClear={this.handleClearSearch}
          placeholder="Search entries by title"
        />
        <EntryTable
          entries={entries}
          selected={selectedEntriesIds}
          areAllSelected={areAllSelected}
          onChangeAll={this.handleChangeAll}
          onCheckboxChange={this.handleCheckboxChange}
          defaultLocale={this.state.defaultLocale}
        />
        <Stack justifyContent="center" fullWidth>
          <Button onClick={this.handleClose}>Cancel</Button>
          <Button variant="positive" onClick={this.handleSubmit}>
            Send for Translation
          </Button>
        </Stack>
      </section>
    );
  }

  isSubmitted = ({ fields: { lilt_status } }) => {
    const { defaultLocale } = this.state;
    const invalidLiltStatus = lilt_status
      ? !PRE_SUBMISSION_STATUSES.includes(lilt_status[defaultLocale])
      : false;
    return invalidLiltStatus;
  };

  filterSelectableEntries = searchQuery => ({ fields: { title } }) => {
    const unsearchableTitles = [];
    if (!title) {
      return false;
    }

    const titles = Object.values(title);
    titles.forEach(t => {
      if (typeof t !== 'string' && typeof t !== 'number') {
        unsearchableTitles.push(t);
      }
    });
    if (unsearchableTitles.length > 0) {
      this.setState({ showUnsearchableWarning: true });
    }
    return titles.some(
      t =>
        (typeof t === 'number' || typeof t === 'string') &&
        String(t)
          .toLowerCase()
          .includes(searchQuery)
    );
  };
}

EntriesDialog.propTypes = {
  sdk: PropTypes.object.isRequired
};

export default EntriesDialog;
