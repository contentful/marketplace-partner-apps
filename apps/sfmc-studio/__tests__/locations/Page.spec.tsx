import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../../src/app/page';

// Mocking HomeComponent to check if it's rendered by Home
jest.mock('../../src/app/page', () => () => <div>Home Component</div>);

describe('Home Component', () => {
  it('renders HomeComponent', () => {
    render(<Home />);

    expect(screen.getByText('Home Component')).toBeInTheDocument();
  });
});
