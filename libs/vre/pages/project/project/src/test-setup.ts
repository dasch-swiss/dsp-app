// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
import 'jest-preset-angular/setup-jest';

// Mock HTMLAnchorElement.prototype.click to prevent JSDOM navigation errors
// This is needed for tests that programmatically trigger downloads
HTMLAnchorElement.prototype.click = jest.fn();
