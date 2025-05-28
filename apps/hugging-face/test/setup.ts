import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from testing-library/jest-dom
expect.extend(matchers);

// Mock URL.createObjectURL
if (typeof global.URL.createObjectURL === 'undefined') {
  global.URL.createObjectURL = vi.fn((value) => `${value}`);
}

// Run cleanup after each test case
afterEach(() => {
  cleanup();

  // Reset the URL.createObjectURL mock after each test
  if (typeof global.URL.createObjectURL === 'function' && vi.isMockFunction(global.URL.createObjectURL)) {
    vi.mocked(global.URL.createObjectURL).mockClear();
  }
});
