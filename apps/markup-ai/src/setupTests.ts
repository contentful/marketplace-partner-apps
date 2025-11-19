// Setup for React Testing Library and DOM testing
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { matchers as emotionMatchers } from '@emotion/jest';
import { expect } from 'vitest';

// Extend Vitest expect with Emotion matchers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
expect.extend(emotionMatchers as any);

// Configure React Testing Library to use data-testid attribute
configure({
  testIdAttribute: 'data-testid',
});
