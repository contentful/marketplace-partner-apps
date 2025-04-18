import { render, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('Renders configuration form', () => {
    render(<ConfigScreen />);
    
    expect(screen.getByText('Hugging Face Integration Configuration')).toBeTruthy();
    expect(screen.getByLabelText('Hugging Face API Key')).toBeTruthy();
    expect(screen.getByLabelText('Text Model ID')).toBeTruthy();
    expect(screen.getByLabelText('Image Model ID')).toBeTruthy();
  });

  it('Updates form values', () => {
    render(<ConfigScreen />);
    
    const apiKeyInput = screen.getByLabelText('Hugging Face API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    
    expect((apiKeyInput as HTMLInputElement).value).toBe('test-api-key');
  });
});
