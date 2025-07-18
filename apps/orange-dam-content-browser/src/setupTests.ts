// src/setupTests.ts
import './styles.css'

// Mock globals for testing
global.console = {
  ...console,
  // Suppress console.error during tests unless it's an actual error we want to see
  error: jest.fn(),
  warn: jest.fn(),
}
