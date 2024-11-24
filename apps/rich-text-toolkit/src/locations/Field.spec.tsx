import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Field from './Field';
import { IsWithinLicenseLimits } from '../api/licensing';
import { convert } from '../api/convert';
import { useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';

// Mock dependencies
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

vi.mock('../api/licensing', () => ({
  IsWithinLicenseLimits: vi.fn(),
}));

vi.mock('../api/convert', () => ({
  convert: vi.fn(),
}));

vi.mock('@contentful/field-editor-rich-text', () => ({
  RichTextEditor: vi.fn().mockImplementation(() => <div data-testid="mock-rich-text-editor" />),
}));

describe('Field', () => {
  const mockSDK: FieldAppSDK = {
    field: {
      getValue: vi.fn().mockReturnValue({}),
      setValue: vi.fn(),
      removeValue: vi.fn(),
      onValueChanged: vi.fn(),
      onIsDisabledChanged: vi.fn(),
      onSchemaErrorsChanged: vi.fn(),
      getIsDisabled: vi.fn(),
      setInvalid: vi.fn(),
      locale: 'en-US',
    },
    locales: {
      default: 'en-US',
      available: ['en-US'],
      names: { 'en-US': 'English (US)' },
      fallbacks: { 'en-US': false },
      optional: { 'en-US': false },
      direction: {},
    },
    window: {
      startAutoResizer: vi.fn(),
      stopAutoResizer: vi.fn(),
      updateHeight: vi.fn(),
    },
    parameters: {
      installation: {
        enableJsonPreview: true,
        enableImport: true,
      },
      instance: undefined,
      invocation: undefined,
    },
    entry: {
      getSys: vi.fn().mockReturnValue({
        space: { sys: { id: 'test-space' } },
        environment: { sys: { id: 'test-environment' } },
        id: 'test-entry',
      }),
      save: vi.fn(),
    },
    ids: {
      space: '123',
    },
  } as unknown as FieldAppSDK;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSDK).mockReturnValue(mockSDK as unknown as FieldAppSDK);
    vi.mocked(IsWithinLicenseLimits).mockResolvedValue(true);
    vi.mocked(convert).mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<Field />);
    expect(mockSDK.window.startAutoResizer).toHaveBeenCalled();
  });
});
