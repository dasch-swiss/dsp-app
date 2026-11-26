import { TestBed } from '@angular/core/testing';
import { FEATURE_TOUR_CHANNEL, FeatureTour, FeatureTourChannel } from './feature-tour';
import { FEATURE_TOURS_OFF_STORAGE_KEY, FeatureTourService } from './feature-tour.service';

describe('FeatureTourService', () => {
  const tour: FeatureTour = { id: 'test', liveOn: '2026-12-02' };
  /** The day before the live day: on stage and dev, not in production. */
  const dayBeforeLive = new Date(2026, 11, 1, 10);

  const service = (channel?: FeatureTourChannel) => {
    TestBed.configureTestingModule({
      providers: channel === undefined ? [] : [{ provide: FEATURE_TOUR_CHANNEL, useValue: channel }],
    });
    return TestBed.inject(FeatureTourService);
  };

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers({ now: dayBeforeLive });
  });

  afterEach(() => jest.useRealTimers());

  it('follows the channel it is given', () => {
    expect(service('stage').shouldShow(tour)).toBe(true);
  });

  it('counts as production without a channel', () => {
    expect(service().shouldShow(tour)).toBe(false);
  });

  it('does not show any tour while tours are turned off', () => {
    localStorage.setItem(FEATURE_TOURS_OFF_STORAGE_KEY, 'x');

    expect(service('dev').shouldShow(tour)).toBe(false);
  });
});
