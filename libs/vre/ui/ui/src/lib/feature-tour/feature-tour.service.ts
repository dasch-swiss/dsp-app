import { inject, Injectable, signal } from '@angular/core';
import { FEATURE_TOUR_CHANNEL, FeatureTour, featureTourStorageKey, isFeatureTourActive } from './feature-tour';

/**
 * Turns every feature tour off in this browser while set, whatever its value. The e2e suite sets it
 * before the app boots, as a literal in `cypress/support/e2e.ts`: rename both together.
 */
export const FEATURE_TOURS_OFF_STORAGE_KEY = 'dsp.featureTours.off';

/**
 * Decides whether a feature tour shows, and remembers that this browser has seen it and been on its
 * page. It also holds which tour is on screen, and which should open without its delay.
 *
 * `localStorage`, not the user profile: a tour announces a change to the UI, and seeing it once
 * per browser is close enough.
 */
@Injectable({ providedIn: 'root' })
export class FeatureTourService {
  private readonly _channel = inject(FEATURE_TOUR_CHANNEL, { optional: true }) ?? 'prod';

  /** Bumped on every write, so that a signal reading this service sees what another component wrote. */
  private readonly _revision = signal(0);

  private readonly _openTour = signal<string | null>(null);
  /** The id of the tour on screen: one at a time, as two would cover each other. */
  readonly openTour = this._openTour.asReadonly();

  /** Tours asked to open as soon as their page renders, without the usual wait. */
  private readonly _startNow = new Set<string>();

  /** Whether the tour is within its days on this deployment and this browser has not seen it yet. */
  shouldShow(tour: FeatureTour): boolean {
    // Read for its dependency only: localStorage is not a signal.
    this._revision();
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
    this._write(featureTourStorageKey(tour));
  }

  /** Whether this browser has been on the tour's page while the tour could show: its teaser is no longer needed. */
  wasVisited(tour: FeatureTour): boolean {
    // See `shouldShow`.
    this._revision();
    try {
      return localStorage.getItem(visitedKey(tour)) !== null;
    } catch {
      return true;
    }
  }

  markVisited(tour: FeatureTour): void {
    this._write(visitedKey(tour));
  }

  /** Has the tour open without its first-appearance delay the next time its page renders. */
  startNow(tour: FeatureTour): void {
    this._startNow.add(tour.id);
  }

  /** Whether `startNow` was asked for the tour. Consumes the request: only the next render skips the delay. */
  takeStartNow(tour: FeatureTour): boolean {
    return this._startNow.delete(tour.id);
  }

  /** Puts the tour on screen, unless another one is. */
  claim(tour: FeatureTour): boolean {
    if (this._openTour() !== null) {
      return false;
    }
    this._openTour.set(tour.id);
    return true;
  }

  /** Frees the screen, if the tour holds it. */
  release(tour: FeatureTour): void {
    if (this._openTour() === tour.id) {
      this._openTour.set(null);
    }
  }

  private _write(key: string): void {
    try {
      localStorage.setItem(key, new Date().toISOString());
    } catch {
      // See `shouldShow`.
    }
    this._revision.update(revision => revision + 1);
  }
}

function visitedKey(tour: FeatureTour): string {
  return `${featureTourStorageKey(tour)}.visited`;
}
