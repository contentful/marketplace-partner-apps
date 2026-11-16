import Field from './Field';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Field component', () => {
  it('renders the empty state when no survey is selected', () => {
    mockSdk.field.getValue.mockReturnValue(undefined);
    const { getByText } = render(<Field />);

    expect(getByText('No Alchemer survey selected.')).toBeInTheDocument();
    expect(getByText('Select a survey')).toBeInTheDocument();
  });

  it('renders the selected survey card when a value exists', () => {
    mockSdk.field.getValue.mockReturnValue({
      surveyId: '123',
      title: 'Customer Satisfaction',
      status: 'launched',
      url: 'https://survey.alchemer.com/s3/123/customer-satisfaction',
      editUrl: 'https://app.alchemer.com/projects/editor?id=123',
      savedAt: '2026-07-27T00:00:00.000Z',
    });
    const { getByText } = render(<Field />);

    expect(getByText('Customer Satisfaction')).toBeInTheDocument();
    expect(getByText('Survey 123')).toBeInTheDocument();
    expect(getByText('Edit in Alchemer')).toBeInTheDocument();
  });

  it('sandboxes the preview iframe and only loads the validated share url', () => {
    const url = 'https://survey.alchemer.com/s3/123/customer-satisfaction';
    mockSdk.field.getValue.mockReturnValue({
      surveyId: '123',
      title: 'Customer Satisfaction',
      status: 'launched',
      url,
      editUrl: 'https://app.alchemer.com/projects/editor?id=123',
      savedAt: '2026-07-27T00:00:00.000Z',
    });
    const { getByText, container } = render(<Field />);

    fireEvent.click(getByText('Preview'));
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute('src')).toBe(url);
    // No allow-top-navigation: a framed page must not be able to redirect the
    // Contentful tab.
    expect(iframe!.getAttribute('sandbox')).toBe('allow-scripts allow-forms allow-same-origin');
  });

  it('refuses to render non-Alchemer or javascript: urls from the stored value', () => {
    mockSdk.field.getValue.mockReturnValue({
      surveyId: '123',
      title: 'Tampered',
      status: 'launched',
      url: 'javascript:alert(1)',
      editUrl: 'https://attacker.example/phish',
      savedAt: '2026-07-27T00:00:00.000Z',
    });
    const { getByText, queryByText, container } = render(<Field />);

    // The card itself still renders so the editor can see what is stored.
    expect(getByText('Tampered')).toBeInTheDocument();
    expect(getByText(/not Alchemer URLs/)).toBeInTheDocument();
    expect(queryByText('Open share link')).toBeNull();
    expect(queryByText('Edit in Alchemer')).toBeNull();
    expect(queryByText('Preview')).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('reports an unrecognized stored value instead of crashing', () => {
    // No surveyId/title and no status: the old card threw on status.toLowerCase().
    mockSdk.field.getValue.mockReturnValue({ something: 'else' });
    const { getByText } = render(<Field />);

    expect(getByText(/does not recognize/)).toBeInTheDocument();
    expect(getByText('Remove')).toBeInTheDocument();
    expect(getByText('Select a survey')).toBeInTheDocument();
  });

  it('does not re-request the list in a loop when the first page fails', async () => {
    mockSdk.field.getValue.mockReturnValue(undefined);
    const create = mockSdk.cma.appActionCall.createWithResponse as ReturnType<typeof vi.fn>;
    create.mockClear();
    create.mockResolvedValue({
      response: {
        body: JSON.stringify({ ok: false, error: 'Alchemer rejected the API credentials.' }),
      },
    });
    const { getByText, findByText } = render(<Field />);

    fireEvent.click(getByText('Select a survey'));
    expect(await findByText('Alchemer rejected the API credentials.')).toBeInTheDocument();
    // The error surfaces, loading flips back to false, and the picker must
    // settle there instead of scheduling another load.
    await waitFor(() => expect(getByText('Refresh')).toBeInTheDocument());
    expect(create).toHaveBeenCalledTimes(1);
  });
});
