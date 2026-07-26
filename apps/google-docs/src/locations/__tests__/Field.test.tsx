import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the GoogleDocField component before importing Field
vi.mock('../../components/GoogleDocField', () => ({
  default: () => <div data-testid="google-doc-field">Google Doc Field Mock</div>
}));

// Define the mock SDK
const mockFieldSdk = {
  field: {
    getValue: vi.fn(),
    setValue: vi.fn(),
    id: 'googleDocId'
  },
  ids: {
    app: 'test-app'
  },
  contentType: {
    fields: []
  },
  parameters: {
    installation: {}
  }
};

// Mock the SDK module before importing Field
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockFieldSdk,
  useCMA: () => ({}),
  SDKContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (sdk: any) => React.ReactNode }) => children({})
  }
}));

// Import Field after all mocks are defined
import Field from '../Field';

describe('Field component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('includes the app ID information', () => {
    const { getByText } = render(<Field />);
    const appIdContainer = getByText(/AppId:/);
    expect(appIdContainer).toBeInTheDocument();
    expect(appIdContainer.parentElement).toHaveTextContent('AppId: test-app');
  });
  
  it('renders the GoogleDocField component', () => {
    const { getByText } = render(<Field />);
    expect(getByText('Google Doc Field Mock')).toBeInTheDocument();
  });
}); 