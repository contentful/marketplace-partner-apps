import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { Warning, ContentChangedWarning, EmptyTargetLocalesWarning } from '../src/warnings';

describe('Warnings', () => {
  afterEach(cleanup);

  it('renders generic Warning', () => {
    const title = 'mock_title';
    const body = 'mock_body';

    const { getByText } = render(<Warning title={title} body={body} />);
    expect(getByText(body)).toBeInTheDocument();
  });

  it('renders ContentChangedWarning', () => {
    const { getByText } = render(<ContentChangedWarning isVisible={true} onDismiss={() => {}} />);
    expect(getByText('Warning')).toBeInTheDocument();
  });

  it('renders EmptyTargetLocalesWarning', () => {
    const { getByText } = render(<EmptyTargetLocalesWarning isVisible={true} />);
    expect(
      getByText('One or more target language(s) must be selected to continue')
    ).toBeInTheDocument();
  });
});
