import { of } from 'rxjs';
import { switchMap } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { retryOnError } from './retryOnError';

describe('RetryOnError Operator', () => {
  let scheduler: TestScheduler;

  // https://stackoverflow.com/questions/57406445/rxjs-marble-testing-retrywhen
  const createRetryableStream = (...obs$: any[]) => {
    const http = jest.fn();
    http.mockReturnValueOnce(obs$[0]);
    if (obs$.length > 1) {
      for (let i = 1; i < obs$.length; i++) {
        http.mockReturnValueOnce(obs$[i]);
      }
    }

    return of(undefined).pipe(switchMap(() => http()));
  };

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should get a completed response', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const values = { a: 20 };

      const source$ = createRetryableStream(cold('a|', values));

      const expectedMarble = 'a|';
      const expectedValues = { a: 20 };

      const result$ = source$.pipe(retryOnError(1, 1, [0], true));

      expectObservable(result$).toBe(expectedMarble, expectedValues);
    });
  });

  it('should get a completed response after 1 unsuccessful request', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const values = { a: 20 };

      const ajaxError = { status: 0 };

      const source$ = createRetryableStream(cold('#', undefined, ajaxError), cold('a|', values));

      const expectedMarble = '-a|';
      const expectedValues = { a: 20 };

      const result$ = source$.pipe(retryOnError(1, 1, [0], true));

      expectObservable(result$).toBe(expectedMarble, expectedValues);
    });
  });

  it('should get an error after 2 unsuccessful requests', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const values = { a: 20 };

      const ajaxError = { status: 0 };

      const source$ = createRetryableStream(
        cold('#', undefined, ajaxError),
        cold('#', undefined, ajaxError),
        cold('a|', values)
      );

      const expectedMarble = '-#';

      const result$ = source$.pipe(retryOnError(1, 1, [0], true));

      expectObservable(result$).toBe(expectedMarble, undefined, ajaxError);
    });
  });

  it('should not retry on certain error status', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const ajaxError = { status: 400 };

      const source$ = createRetryableStream(cold('#', undefined, ajaxError), cold('#', undefined, ajaxError));

      const expectedMarble = '#';

      const result$ = source$.pipe(retryOnError(1, 1, [0], true));

      expectObservable(result$).toBe(expectedMarble, undefined, ajaxError);
    });
  });
});
