import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import EntryEditor from '@/locations/EntryEditor';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useFieldValue: jest.fn((fieldId) => {
    if (fieldId === 'experiment') {
      return [{}];
    }
    if (fieldId === 'experimentName') {
      return ['', jest.fn()];
    }
    return [null, jest.fn()];
  }),
}));

describe('EntryEditor component', () => {
  it('renders the component', () => {
    const { getByText } = render(<EntryEditor />);
    expect(getByText('Experiment Name (required):')).toBeInTheDocument();
  });

  it('displays the default experiment name', () => {
    const { getByDisplayValue } = render(<EntryEditor />);
    expect(getByDisplayValue('')).toBeInTheDocument();
  });

  it('updates the experiment name on input change', () => {
    const { getByLabelText } = render(<EntryEditor />);
    const input = getByLabelText('Experiment Name (required):') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Experiment Name' } });
    waitFor(() => {
      expect(input.value).toBe('New Experiment Name');
    });
  });

  it('adds a variation on button click', () => {
    const { getByText } = render(<EntryEditor />);
    const button = getByText('Add Variation');
    fireEvent.click(button);
    waitFor(() => {
      expect(getByText('Control')).toBeInTheDocument();
    });
  });

  it('removes a variation on button click', () => {
    const { getByText, queryByText } = render(<EntryEditor />);
    const addButton = getByText('Add Variation');
    fireEvent.click(addButton);
    waitFor(() => {
      expect(getByText('Control')).toBeInTheDocument();
      expect(getByText('X')).toBeInTheDocument();
      const removeButton = getByText('X');
      fireEvent.click(removeButton);
      waitFor(() => {
        expect(queryByText('Control')).not.toBeInTheDocument();
      });
    });
  });
});
