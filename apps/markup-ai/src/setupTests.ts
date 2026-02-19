// Setup for React Testing Library and DOM testing
import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { matchers as emotionMatchers } from "@emotion/jest";
import { afterEach, expect } from "vitest";

// Extend Vitest expect with Emotion matchers
// The Emotion matchers are typed for Jest, but Vitest's expect.extend accepts any matcher object
expect.extend(emotionMatchers as unknown as Parameters<typeof expect.extend>[0]);

// Configure React Testing Library to use data-testid attribute
configure({
  testIdAttribute: "data-testid",
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
