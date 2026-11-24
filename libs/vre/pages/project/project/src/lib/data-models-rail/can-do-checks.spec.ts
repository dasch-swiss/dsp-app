import { DestroyRef } from '@angular/core';
import { of } from 'rxjs';
import { CanDo } from '../ontology-map/data-model-editor';
import { CanDoChecks, CHECK_DELAY_MS } from './can-do-checks';

const destroyRef = { onDestroy: () => () => undefined } as unknown as DestroyRef;

describe('CanDoChecks', () => {
  const make = (answer: CanDo) => {
    const ask = jest.fn(() => of(answer));
    return { checks: new CanDoChecks(ask, destroyRef), ask };
  };

  it('asks once per item and keeps the answer', () => {
    const { checks, ask } = make({ canDo: false, reason: 'used' });
    checks.check('a');
    checks.check('a');
    expect(ask).toHaveBeenCalledTimes(1);
    expect(checks.results().get('a')).toEqual({ canDo: false, reason: 'used' });
  });

  it('asks again after a check the API could not answer', () => {
    const { checks, ask } = make({ canDo: false, failed: true });
    checks.check('a');
    checks.check('a');
    expect(ask).toHaveBeenCalledTimes(2);
  });

  it('asks again once cleared, as after an edit', () => {
    const { checks, ask } = make({ canDo: true });
    checks.check('a');
    checks.clear();
    expect(checks.results().size).toBe(0);
    checks.check('a');
    expect(ask).toHaveBeenCalledTimes(2);
  });

  describe('checkSoon', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('asks once the pointer has rested', () => {
      const { checks, ask } = make({ canDo: true });
      checks.checkSoon('a');
      expect(ask).not.toHaveBeenCalled();
      jest.advanceTimersByTime(CHECK_DELAY_MS);
      expect(ask).toHaveBeenCalledTimes(1);
    });

    it('asks nothing when the pointer moves on first', () => {
      const { checks, ask } = make({ canDo: true });
      checks.checkSoon('a');
      checks.cancel();
      checks.checkSoon('b');
      checks.cancel();
      jest.advanceTimersByTime(CHECK_DELAY_MS);
      expect(ask).not.toHaveBeenCalled();
    });
  });
});
