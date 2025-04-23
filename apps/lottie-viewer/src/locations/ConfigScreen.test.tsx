import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigScreen from './ConfigScreen';
import { useJsonFieldsState } from '@src/hooks/useJsonFieldsState';
import { useSDK } from '@contentful/react-apps-toolkit';
import { vi } from 'vitest';
// import { describe, test, expect } from 'vitest';

vi.mock('@src/hooks/useJsonFieldsState');
vi.mock('@contentful/react-apps-toolkit');

const mockUseJsonFieldsState = useJsonFieldsState as unknown as ReturnType<typeof vi.fn>;
const mockUseSDK = useSDK as unknown as ReturnType<typeof vi.fn>;

describe('ConfigScreen', () => {
  const mockFields = [
    {
      contentTypeId: 'blogPost',
      contentTypeName: 'Blog Post',
      fieldId: 'animation',
      fieldName: 'Animation',
      isEnabled: true,
      originalEnabled: true,
    },
    {
      contentTypeId: 'blogPost',
      contentTypeName: 'Blog Post',
      fieldId: 'lottie',
      fieldName: 'Lottie',
      isEnabled: false,
      originalEnabled: false,
    },
  ];

  const updateField = vi.fn();
  const initialize = vi.fn();
  const resetOriginalState = vi.fn();

  const setup = (fields = mockFields) => {
    mockUseJsonFieldsState.mockReturnValue({
      jsonFields: fields,
      jsonFieldsRef: { current: fields },
      updateField,
      initialize,
      resetOriginalState,
    });

    mockUseSDK.mockReturnValue({
      app: {
        onConfigure: vi.fn(),
        onConfigurationCompleted: vi.fn(),
        getParameters: vi.fn().mockResolvedValue({}),
        setReady: vi.fn(),
      },
      cma: {},
      ids: { app: 'app-id', space: 'space-id', environment: 'env-id' },
    });

    render(<ConfigScreen />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders instructional headings and paragraphs', () => {
    setup();

    expect(screen.getByText(/Set up Lottie Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Lottie Preview to your field editor/i)).toBeInTheDocument();
    expect(screen.getByText(/Preview your animation directly/i)).toBeInTheDocument();
  });

  it('renders Autocomplete items from JSON fields', () => {
    setup();

    expect(screen.getByText('Blog Post > Animation')).toBeInTheDocument();
    expect(screen.getByText('Blog Post > Lottie')).toBeInTheDocument();
  });

  it('renders a pill only for enabled fields', () => {
    setup();

    expect(screen.getByText('Blog Post > Animation')).toBeInTheDocument();
    expect(screen.queryByText('Blog Post > Lottie')).not.toBeInTheDocument();
  });

  it('calls updateField when a pill is closed', () => {
    setup();

    const pillClose = screen.getByRole('button', { name: /Blog Post > Animation/i });
    fireEvent.click(pillClose);

    expect(updateField).toHaveBeenCalledWith('blogPost', 'animation', { isEnabled: false });
  });

  it('renders a note when there are no JSON fields', () => {
    setup([]); // pass empty array

    expect(screen.getByText(/There are no JSON object field types to select to use with Lottie Preview/i)).toBeInTheDocument();
  });
});
