// Setup for React Testing Library and DOM testing
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure React Testing Library to use data-testid attribute
configure({
  testIdAttribute: 'data-testid',
});
