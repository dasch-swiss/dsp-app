/**
 * Detects a MutationObserver whose callbacks keep re-triggering each other without the page ever
 * yielding to a macrotask, e.g. an observer running inside Angular's zone while change detection
 * writes to the DOM.
 *
 * Such a loop blocks the main thread, which the Cypress runner shares with the app, so without this
 * guard the run hangs instead of failing. The guard disconnects the looping observer to unblock the
 * page and records it, so `assertNoMutationObserverLoop()` can fail the test.
 */
const LOOP_KEY = '__e2eMutationObserverLoop';
const MAX_CALLBACKS_WITHOUT_YIELDING = 1000;

interface MutationObserverLoop {
  callbacks: number;
  observerCreatedAt: string;
}

type GuardedWindow = Cypress.AUTWindow & { [LOOP_KEY]?: MutationObserverLoop };

/** Must run before the app's scripts load (`window:before:load`), so zone.js wraps the guarded class. */
export function installMutationObserverLoopGuard(win: GuardedWindow): void {
  const NativeMutationObserver = win.MutationObserver;
  let callbacksWithoutYielding = 0;
  let resetScheduled = false;

  win.MutationObserver = class extends NativeMutationObserver {
    constructor(callback: MutationCallback) {
      const observerCreatedAt = captureStack(win);
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
          win[LOOP_KEY] ??= { callbacks: callbacksWithoutYielding, observerCreatedAt };
          return;
        }
        callback.call(observer, records, observer);
      });
    }
  };
}

function captureStack(win: GuardedWindow): string {
  const AppError = win.Error;
  const previousLimit = AppError.stackTraceLimit;
  AppError.stackTraceLimit = 20;
  const stack = new AppError().stack ?? '';
  AppError.stackTraceLimit = previousLimit;
  return stack.split('\n').slice(1).join('\n');
}

export function assertNoMutationObserverLoop(): void {
  cy.window({ log: false }).then((win: GuardedWindow) => {
    const loop = win[LOOP_KEY];
    expect(
      loop,
      loop &&
        `a MutationObserver fired ${loop.callbacks} times without yielding; observer created at:\n${loop.observerCreatedAt}`
    ).to.be.undefined;
  });
}
