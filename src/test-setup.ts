// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};
import 'jest-preset-angular/setup-jest';

// jsdom 20 dispatches postMessage through a timer after its document is disposed.
window.postMessage = ((message: unknown, targetOrigin: string) => {
  const origin = window.location.origin;

  if (targetOrigin !== '*' && targetOrigin !== origin) {
    return;
  }

  window.setTimeout(() => {
    if (!window.document) {
      return;
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data: message,
        origin,
      }),
    );
  });
}) as Window['postMessage'];
