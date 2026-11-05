/**
 * Detects a MutationObserver whose callbacks keep re-triggering it without the page ever yielding to
 * a macrotask, e.g. an observer running inside Angular's zone while change detection writes to the DOM.
 *
 * Such a loop blocks the main thread, which the Cypress runner shares with the app, so without this
 * guard the run hangs instead of failing. The guard disconnects the looping observer to unblock the
 * page and records it, so `assertNoMutationObserverLoop()` can fail the test.
 */
const MAX_CALLBACKS_WITHOUT_YIELDING = 1000;

interface MutationObserverLoop {
  callbacks: number;
  observerCreatedAt: string;
}

// Kept in the spec's realm, not on the app window, so a loop is still reported after the test
// navigates or reloads the page.
let detectedLoop: MutationObserverLoop | undefined;

/** Must run before the app's scripts load (`window:before:load`), so zone.js wraps the guarded class. */
export function installMutationObserverLoopGuard(win: Cypress.AUTWindow): void {
  const NativeMutationObserver = win.MutationObserver;

  win.MutationObserver = class extends NativeMutationObserver {
    constructor(callback: MutationCallback) {
      const observerCreatedAt = captureStack(win);
      let callbacksWithoutYielding = 0;
      let resetScheduled = false;
      super((records, observer) => {
        if (!resetScheduled) {
          resetScheduled = true;
          win.setTimeout(() => {
            callbacksWithoutYielding = 0;
            resetScheduled = false;
          });
        }
        if (++callbacksWithoutYielding > MAX_CALLBACKS_WITHOUT_YIELDING) {
          observer.disconnect();
          detectedLoop ??= { callbacks: callbacksWithoutYielding, observerCreatedAt };
          return;
        }
        callback.call(observer, records, observer);
      });
    }
  };
}

function captureStack(win: Cypress.AUTWindow): string {
  const AppError = win.Error;
  const previousLimit = AppError.stackTraceLimit;
  AppError.stackTraceLimit = 20;
  const stack = new AppError().stack ?? '';
  AppError.stackTraceLimit = previousLimit;
  return stack.split('\n').slice(1).join('\n');
}

export function resetMutationObserverLoopGuard(): void {
  detectedLoop = undefined;
}

export function assertNoMutationObserverLoop(): void {
  cy.then(() => {
    expect(
      detectedLoop,
      detectedLoop &&
        `a MutationObserver fired ${detectedLoop.callbacks} times without yielding; observer created at:\n${detectedLoop.observerCreatedAt}`
    ).to.be.undefined;
  });
}
