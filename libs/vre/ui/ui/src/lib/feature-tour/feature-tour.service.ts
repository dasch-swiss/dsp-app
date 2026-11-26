import { inject, Injectable } from '@angular/core';
import { FEATURE_TOUR_CHANNEL, FeatureTour, featureTourStorageKey, isFeatureTourActive } from './feature-tour';

/**
 * Turns every feature tour off in this browser while set, whatever its value. The e2e suite sets it
 * before the app boots, as a literal in `cypress/support/e2e.ts`: rename both together.
 */
export const FEATURE_TOURS_OFF_STORAGE_KEY = 'dsp.featureTours.off';

/**
 * Decides whether a feature tour shows, and remembers that this browser has seen it.
 *
 * `localStorage`, not the user profile: a tour announces a change to the UI, and seeing it once
 * per browser is close enough.
 */
@Injectable({ providedIn: 'root' })
export class FeatureTourService {
  private readonly _channel = inject(FEATURE_TOUR_CHANNEL, { optional: true }) ?? 'prod';

  /** Whether the tour is within its days on this deployment and this browser has not seen it yet. */
  shouldShow(tour: FeatureTour): boolean {
    if (!isFeatureTourActive(tour, this._channel, new Date())) {
      return false;
    }
    try {
      return (
        localStorage.getItem(FEATURE_TOURS_OFF_STORAGE_KEY) === null &&
        localStorage.getItem(featureTourStorageKey(tour)) === null
      );
    } catch {
      // Storage disabled by the browser. Showing nothing beats showing the tour on every visit.
      return false;
    }
  }

  markSeen(tour: FeatureTour): void {
    try {
      localStorage.setItem(featureTourStorageKey(tour), new Date().toISOString());
    } catch {
      // See `shouldShow`.
    }
  }
}
