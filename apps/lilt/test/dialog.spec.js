import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { DialogExtension } from '../src/dialog';
import { mockSdk } from './mock-sdk';
import { DIALOG_TYPES } from '../src/constants';
import EntriesDialog from '../src/entries-dialog';

jest.mock('../src/contentful-management-client');

describe('DialogExtension', () => {
  afterEach(cleanup);

  const entryId = 'asdf1234';

  it('renders SubmissionDialog component', () => {
    const sdk = mockSdk();
    sdk.parameters.invocation.type = DIALOG_TYPES.SEND_FOR_LOCALIZATION;
    sdk.parameters.invocation.selected = [];
    sdk.parameters.invocation.selectable = [];
    sdk.parameters.installation = {};
    const { getByText } = render(<DialogExtension sdk={sdk} entryId={entryId} />);
    expect(getByText('Send for Localization')).toBeInTheDocument();
  });

  it('renders SubmissionDialog component for multiple entries', () => {
    const sdk = mockSdk();
    sdk.parameters.invocation.type = DIALOG_TYPES.SEND_MULTIPLE_FOR_LOCALIZATION;
    sdk.parameters.invocation.selectable = [];
    const { getByText } = render(<DialogExtension sdk={sdk} entryId={entryId} />);
    expect(getByText('Send Multiple Entries for Localization')).toBeInTheDocument();
  });

  it('renders LanguageSelector with TranslationTypeRadio for multiple entries', () => {
    const sdk = mockSdk();
    sdk.parameters.invocation.type = DIALOG_TYPES.SEND_MULTIPLE_FOR_LOCALIZATION;
    sdk.parameters.invocation.selectable = [];
    sdk.parameters.installation.showTranslationTypeUI = true;
    const { getByText } = render(<DialogExtension sdk={sdk} entryId={entryId} />);
    expect(getByText('Translation Type')).toBeInTheDocument();
    expect(getByText('Verified Translation')).toBeInTheDocument();
    expect(getByText('Instant Translation')).toBeInTheDocument();
  });

  it('renders EntriesDialog component', () => {
    const sdk = mockSdk();
    sdk.parameters.invocation.type = DIALOG_TYPES.ENTRY_SELECTOR;
    sdk.parameters.invocation.entryId = '';

    const { getByText } = render(<EntriesDialog sdk={sdk} entryId={entryId} />);
    // EntryTableLoading is only visible at this point
    expect(getByText('Title')).toBeInTheDocument();
  });
});
