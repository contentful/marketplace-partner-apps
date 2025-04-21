import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConvoxLogo from './ConvoxLogo';

/**
 * for this ConvoxLogo component it is enough to test if the component is rendered correctly or not
 */

describe('ConvoxLogo Component renders correctly', () => {
  it('renders the logo correctly', () => {
    const {unmount} = render(<ConvoxLogo />);
    const logoImage = screen.getAllByTestId('convox-logo');
    expect(logoImage).toBeTruthy();
    unmount();
  });
});
