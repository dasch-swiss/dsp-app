import { StringLiteralV2 } from '@dasch-swiss/dsp-js';

/**
 * Wraps an optional single label string into the StringLiteralV2[] shape DSP-JS uses.
 * Language is empty because the upstream sources (search-by-label results,
 * ListNodeV2, raw ontology metadata) only expose a single label without
 * a language tag.
 */
export const toLabels = (label: string | undefined | null): StringLiteralV2[] =>
  label ? [{ language: '', value: label }] : [];
