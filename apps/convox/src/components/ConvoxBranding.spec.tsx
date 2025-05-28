import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConvoxBranding from './ConvoxBranding';

describe('ConvoxBranding Component', () => {
    it('renders the Convox logo', () => {
        const { unmount } = render(<ConvoxBranding />);
        const logoElement = screen.getByTestId('convox-logo');
        expect(logoElement).toBeTruthy();
        unmount();
    });

    it('renders the correct heading', () => {
        const { unmount } = render(<ConvoxBranding />);
        const headingElement = screen.getByRole('heading', { name: /connect convox/i });
        expect(headingElement).toBeTruthy();
        unmount();
    });

    it('renders the correct description', () => {
        const { unmount } = render(<ConvoxBranding />);
        const headingElement = screen.getByText(/connect your convox account to trigger builds directly from the contentful web app/i);
        expect(headingElement).toBeTruthy();
        unmount();
    });
});
