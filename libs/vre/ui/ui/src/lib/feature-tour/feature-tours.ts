import { FeatureTour } from './feature-tour';

/**
 * Every feature tour in the app, with the day it goes live. A page shows one by passing its name
 * here to `app-feature-tour`, with the steps.
 */
export const FEATURE_TOURS = {
  /** The Data tab's search, filters and table view. */
  dataTab: { id: 'data-tab', liveOn: '2026-11-10' },
} satisfies Record<string, FeatureTour>;

export type FeatureTourName = keyof typeof FEATURE_TOURS;
