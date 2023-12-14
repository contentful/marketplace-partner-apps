import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { ConfigEditor } from '../src/config-editor';
import { mockSdk } from './mock-sdk';

describe('ConfigName', () => {
  afterEach(cleanup);

  it('renders ConfigEditor component', () => {
    const sdk = mockSdk();
    const { container } = render(
      <ConfigEditor
        sdk={sdk}
        isDropdownOpen={true}
        isActive={true}
        formItem={{}}
        connectors={[]}
        memories={[]}
        contentTypes={[]}
        contentfulApiKey=""
        onDropdownClick={() => {}}
        onSelect={() => {}}
        onSubmit={() => {}}
        onDelete={() => {}}
      />
    );
    const formElement = container.querySelectorAll('form');
    const buttonElements = container.querySelectorAll('button');
    const selectElements = container.querySelectorAll('select');
    expect(formElement).toHaveLength(1);
    expect(buttonElements).toHaveLength(3);
    expect(selectElements).toHaveLength(2);
  });
});
