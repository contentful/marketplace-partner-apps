import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { DateLastCompleted, DateLastPublished, DateLastSent } from '../src/dates';

describe('DateLastCompleted', () => {
  afterEach(cleanup);

  it('renders "N/A"', () => {
    const { getByText } = render(<DateLastCompleted />);
    expect(getByText('N/A')).toBeInTheDocument();
  });

  it('renders a date string', () => {
    const lastCompleted = new Date();
    const lastCompletedString = 'a few seconds ago';
    const { getByText } = render(<DateLastCompleted lastCompleted={lastCompleted} />);
    expect(getByText(lastCompletedString)).toBeInTheDocument();
  });
});

describe('DateLastPublished', () => {
  it('renders "N/A"', () => {
    const { getByText } = render(<DateLastPublished />);
    expect(getByText('N/A')).toBeInTheDocument();
  });

  it('renders a date string', () => {
    const lastPublished = new Date();
    const lastPublishedString = 'a few seconds ago';
    const { getByText } = render(<DateLastPublished lastPublished={lastPublished} />);
    expect(getByText(lastPublishedString)).toBeInTheDocument();
  });
});

describe('DateLastSent', () => {
  it('renders "N/A"', () => {
    const { getByText } = render(<DateLastPublished />);
    expect(getByText('N/A')).toBeInTheDocument();
  });

  it('renders a date string', () => {
    const lastSentAt = new Date();
    const lastPublishedString = 'a few seconds ago';
    const { getByText } = render(<DateLastSent lastSentAt={lastSentAt} />);
    expect(getByText(lastPublishedString)).toBeInTheDocument();
  });
});
