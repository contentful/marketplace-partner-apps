import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocalhostWarning from './LocalhostWarning';

describe('LocalhostWarning', () => {
  it('renders the warning title', () => {
    render(<LocalhostWarning />);
    expect(screen.getByText('App running outside of Contentful')).toBeInTheDocument();
  });

  it('renders all paragraphs with correct content', () => {
    render(<LocalhostWarning />);

    const paragraphs = screen.getAllByText(/Contentful/);
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('renders all links with correct hrefs', () => {
    render(<LocalhostWarning />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);

    expect(links[0]).toHaveAttribute(
      'href',
      'https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#locations',
    );
    expect(links[1]).toHaveAttribute(
      'href',
      'https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/#embed-your-app-in-the-contentful-web-app',
    );
    expect(links[2]).toHaveAttribute('href', 'https://app.contentful.com/deeplink?link=apps');
  });
});
