import { config } from '@vue/test-utils';

// Global Vue Test Utils config
config.global.mocks = {
  // Add global mocks here if needed
};

// Mock console.warn/error to keep test output clean if needed,
// or fail tests on warnings
// console.warn = vi.fn();
// console.error = vi.fn();
