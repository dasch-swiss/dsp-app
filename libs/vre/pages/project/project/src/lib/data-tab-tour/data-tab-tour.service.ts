import { Injectable } from '@angular/core';

/**
 * Bump the version when the tour gains a step worth showing again to people who dismissed the
 * previous one: a new key is an unseen tour.
 */
export const DATA_TAB_TOUR_STORAGE_KEY = 'dsp.dataBrowser.tour.v1';

/**
 * Remembers whether this browser has seen the Data tab tour (DEV-7545).
 *
 * `localStorage`, not the user profile: the tour announces a change to the UI, and seeing it once
 * per browser is close enough. Per-user persistence is a possible follow-up.
 */
@Injectable({ providedIn: 'root' })
export class DataTabTourService {
  hasBeenSeen(): boolean {
    try {
      return localStorage.getItem(DATA_TAB_TOUR_STORAGE_KEY) !== null;
    } catch {
      // Storage disabled by the browser. Showing nothing beats showing the tour on every visit.
      return true;
    }
  }

  markSeen(): void {
    try {
      localStorage.setItem(DATA_TAB_TOUR_STORAGE_KEY, new Date().toISOString());
    } catch {
      // See `hasBeenSeen`.
    }
  }
}
