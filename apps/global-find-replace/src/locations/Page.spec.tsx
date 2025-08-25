import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import FindReplaceApp from './Page';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('FindReplaceApp component', () => {
  it('renders without crashing', () => {
    const { container } = render(<FindReplaceApp />);
    expect(container).toBeTruthy();
  });
});
