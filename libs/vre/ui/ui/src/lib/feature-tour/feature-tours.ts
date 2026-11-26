import { FeatureTour } from './feature-tour';

/**
 * Every feature tour in the app, with the day it goes live. A page shows one by passing its name
 * here to `app-feature-tour`, with the steps.
 */
export const FEATURE_TOURS = {
  /** The Data models tab's rail: the data models, their sections and the controlled vocabularies. */
  dataModels: { id: 'data-models', liveOn: '2026-12-02' },
  /** The Data models tab's diagram: its search, filters and export. */
  dataModelsDiagram: { id: 'data-models-diagram', liveOn: '2026-12-02', follows: 'data-models' },
} satisfies Record<string, FeatureTour>;

export type FeatureTourName = keyof typeof FEATURE_TOURS;
