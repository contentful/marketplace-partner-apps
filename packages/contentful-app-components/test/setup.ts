import '@testing-library/jest-dom';

// Mock IntersectionObserver
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
