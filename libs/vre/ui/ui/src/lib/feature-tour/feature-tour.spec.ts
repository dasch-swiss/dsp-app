import { FeatureTour, FeatureTourChannel, featureTourStorageKey, isFeatureTourActive } from './feature-tour';
import { FEATURE_TOURS } from './feature-tours';

describe('isFeatureTourActive', () => {
  /** Goes live on a Wednesday, as the release train has it. */
  const tour: FeatureTour = { id: 'test', liveOn: '2026-12-02' };

  /** A local date and time, as the viewer's clock reads it. */
  const at = (month: number, day: number, hour = 0, minute = 0) => new Date(2026, month - 1, day, hour, minute);

  const lastDayLate = at(12, 8, 23, 59);
  const dayAfterLast = at(12, 9);

  it.each<[FeatureTourChannel, Date, boolean]>([
    ['prod', at(12, 1, 23, 59), false],
    ['prod', at(12, 2), true],
    ['prod', lastDayLate, true],
    ['prod', dayAfterLast, false],
    ['stage', at(11, 30, 23, 59), false],
    ['stage', at(12, 1), true],
    ['stage', lastDayLate, true],
    ['stage', dayAfterLast, false],
    ['dev', at(1, 1), true],
    ['dev', lastDayLate, true],
    ['dev', dayAfterLast, false],
  ])('on %s at %s: %s', (channel, now, active) => {
    expect(isFeatureTourActive(tour, channel, now)).toBe(active);
  });

  it('counts its days across a month end and a change of clocks', () => {
    // Europe's clocks go back on 2026-10-25; the week still ends at local midnight on 2026-11-04.
    const autumn: FeatureTour = { id: 'autumn', liveOn: '2026-10-28' };

    expect(isFeatureTourActive(autumn, 'stage', new Date(2026, 9, 27))).toBe(true);
    expect(isFeatureTourActive(autumn, 'prod', new Date(2026, 10, 3, 23, 59))).toBe(true);
    expect(isFeatureTourActive(autumn, 'prod', new Date(2026, 10, 4))).toBe(false);
  });

  it('never shows a tour whose day it cannot read', () => {
    expect(isFeatureTourActive({ id: 'typo', liveOn: '2026-12-0x' }, 'dev', at(12, 2))).toBe(false);
  });
});

describe('FEATURE_TOURS', () => {
  const tours: FeatureTour[] = Object.values(FEATURE_TOURS);

  it.each(tours.map(tour => [tour.id, tour] as const))('%s goes live on a real YYYY-MM-DD day', (_, tour) => {
    expect(tour.liveOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const [year, month, day] = tour.liveOn.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    expect([date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([year, month, day]);
  });

  it('gives every tour a storage key of its own', () => {
    const keys = tours.map(featureTourStorageKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
