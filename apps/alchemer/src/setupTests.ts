// jest-dom's vitest entry registers the DOM matchers (toBeInTheDocument etc.)
// on vitest's expect automatically.
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

configure({
  // Forma 36 components expose data-test-id (hyphenated), not data-testid.
  testIdAttribute: 'data-test-id',
});
