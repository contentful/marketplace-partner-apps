import { configure } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

configure({
  testIdAttribute: 'data-test-id',
});

// Mock IntersectionObserver (needed for components from shared package)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
  root = null;
  rootMargin = '';
  thresholds = [];
  takeRecords() {
    return [];
  }
} as any;

// Set up react-modal properly for testing (following hugging-face app pattern)
beforeAll(() => {
  // Set up Modal app element to prevent warnings and DOM issues
  const modalRoot = document.createElement('div');
  modalRoot.setAttribute('id', 'modal-root');
  document.body.appendChild(modalRoot);

  try {
    const Modal = require('react-modal');
    Modal.setAppElement('#modal-root');
  } catch (error) {
    // Ignore if react-modal is not available
  }
});

afterEach(async () => {
  // Run standard cleanup first
  cleanup();

  // Clear all timers to prevent async issues
  vi.clearAllTimers();

  // Allow any pending promises to resolve
  await new Promise((resolve) => setTimeout(resolve, 0));
});
