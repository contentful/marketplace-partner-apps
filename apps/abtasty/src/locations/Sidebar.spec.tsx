// Sidebar.spec.tsx
import { render } from '@testing-library/react';
import { vi, describe, it, beforeEach } from 'vitest';
import Sidebar from './Sidebar';

let sdkMock: any;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdkMock,
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    sdkMock = {
      parameters: {
        installation: {
          user_id: '123',
          flagship_account: {
            account_id: 'acc_456',
            account_name: 'Test Account',
          },
          flagship_env: {
            id: 'env_789',
            name: 'Production',
          },
        },
      },
    };
  });

  it('shows error message when parameters are missing', () => {
    sdkMock = {
      parameters: {
        installation: {
          user_id: '',
          abtasty_token: '',
          flagship_account: null,
          flagship_env: null,
        },
      },
    };

    const { getByText } = render(<Sidebar />);
    expect(getByText(/Parameters are not configured/)).toBeInTheDocument();
  });
});