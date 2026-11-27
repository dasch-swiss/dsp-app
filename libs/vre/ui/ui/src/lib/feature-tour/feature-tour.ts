import { InjectionToken } from '@angular/core';

/**
 * A feature tour announces a change to the UI for the week after it reaches production, then stops
 * showing by itself, so nobody has to remember to take it out.
 */
export interface FeatureTour {
  /** Names the tour, and the keys under which this browser remembers it has seen it and been on its page. */
  id: string;
  /**
   * The day the release that ships the tour reaches production, as `YYYY-MM-DD` in the viewer's
   * time zone. Move it when the release moves, or the tour loses the days the release slipped.
   */
  liveOn: string;
  /**
   * The id of the tour this one continues, on a page reached from it. Turning that tour off from its
   * teaser turns this one off too.
   */
  follows?: string;
}

/**
 * Which kind of deployment the app runs on, as far as tours care: `dev` shows a tour as soon as it is
 * built, `stage` from the day before it goes live, `prod` from the day it goes live.
 */
export type FeatureTourChannel = 'dev' | 'stage' | 'prod';

/** The deployment's channel, provided by the app. Without it, tours behave as in production. */
export const FEATURE_TOUR_CHANNEL = new InjectionToken<FeatureTourChannel>('FEATURE_TOUR_CHANNEL');

/**
 * The weekly release train, which decides when a tour shows. A release reaches stage the day before
 * production, and the next one replaces it a week after. Change these with the train.
 */
const RELEASE_TRAIN = {
  /** How many days before production a release is on stage. */
  stageLeadDays: 1,
  /** How many days a tour shows, from `liveOn`: until the next release goes live. */
  tourDays: 7,
} as const;

export function featureTourStorageKey(tour: FeatureTour): string {
  return `dsp.featureTour.${tour.id}`;
}

/**
 * Whether `now` falls within the tour's days on the given channel. Every channel stops it at the end
 * of the last day of the week that starts on `liveOn`; see `FeatureTourChannel` for when it starts.
 */
export function isFeatureTourActive(tour: FeatureTour, channel: FeatureTourChannel, now: Date): boolean {
  const [year, month, day] = tour.liveOn.split('-').map(Number);
  // Local midnights, so a tour starts and ends with the viewer's day, not UTC's.
  const dayFromLive = (offset: number) => new Date(year, month - 1, day + offset);

  const end = dayFromLive(RELEASE_TRAIN.tourDays);
  // A malformed `liveOn` has no end, and a tour without an end would show on dev for good.
  if (Number.isNaN(end.getTime()) || now >= end) {
    return false;
  }
  switch (channel) {
    case 'dev':
      return true;
    case 'stage':
      return now >= dayFromLive(-RELEASE_TRAIN.stageLeadDays);
    case 'prod':
      return now >= dayFromLive(0);
  }
}
