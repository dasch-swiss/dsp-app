import { StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { IriLabelPair, Predicate } from '../model';

/**
 * Build a one-language `StringLiteralV2[]` array — the common case in
 * fixtures that don't care about language switching.
 */
export const englishLabels = (value: string): StringLiteralV2[] => [{ language: 'en', value }];

/**
 * Construct an `IriLabelPair` from an IRI and a single English label.
 * Use this in tests that previously wrote `{ iri, label }` literals.
 * For multi-language fixtures, pass a `labels` array directly.
 */
export const makeIriLabelPair = (
  iri: string,
  label: string,
  options?: { comments?: StringLiteralV2[] }
): IriLabelPair => ({
  iri,
  labels: englishLabels(label),
  comments: options?.comments ?? [],
});

/**
 * Construct a `Predicate` from positional arguments mirroring the legacy
 * constructor call shape `new Predicate(iri, label, objectValueType, isLinkProperty, listObjectIri?)`.
 * Wraps the single label string in an English-only `StringLiteralV2[]`.
 */
export const makePredicate = (
  iri: string,
  label: string,
  objectValueType: string,
  isLinkProperty: boolean,
  listObjectIri?: string,
  comments: StringLiteralV2[] = []
): Predicate => new Predicate(iri, englishLabels(label), objectValueType, isLinkProperty, listObjectIri, comments);
