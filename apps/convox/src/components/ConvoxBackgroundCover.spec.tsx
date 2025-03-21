import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConvoxBackgroundCover from './ConvoxBackgroundCover';

/**
 * for this ConvoxBackgroundCover component it is enough to test if the component is rendered correctly or not
 */

describe('ConvoxBranding Component renders correctly', () => {
  it('renders the component', () => {
    const {unmount} = render(<ConvoxBackgroundCover />);
    const divEl = screen.getByTestId('convox-background-cover');
    expect(divEl).toBeTruthy();
    unmount();
  });
});
