import { Operator } from './operators.config';

/**
 * The wire shape of one confirmed filter as it travels through a URL.
 *
 * This is the one representation of a filter that must stay identical across every page that hosts the
 * chip bar: a link copied out of one page and opened on another must mean the same thing. Which query
 * parameter carries the encoded blob, and when it is written, is each page's own business — see the
 * `SearchFilterState` port.
 */
export interface FilterParam {
  parentIndex: number | null;
  predicateIri: string;
  operator: Operator;
  value: string;
  /**
   * Display label for a linked-*resource* `value` (its IRI) — the "Rita" in "author equals Rita". Only
   * written for the link-value chip case, where the label has no multi-language source the search page
   * already fetches and re-deriving it on rehydration would need a per-chip network round-trip.
   *
   * DEV-6857: list values and resource-class `Matches` chips deliberately do NOT populate this — their
   * labels live in the loaded list tree / ontology and are resolved at chip-render time by
   * `ChipLabelPipe`. Persisting a single-language string here for those cases fossilises the display in
   * the writer's language. Plain string values (typed literals, IsLike patterns, label text) never
   * populate this field either (the value IS the label).
   */
  valueLabel?: string;
}

/** The subset of {@link FilterParam} a caller supplies when encoding; `parentIndex` is positional. */
export interface FilterParamInput {
  predicateIri: string;
  operator: Operator;
  value: string;
  valueLabel?: string;
  parentIndex?: number;
}

const VALID_OPERATORS = new Set<string>(Object.values(Operator));

/**
 * Structural validation for a single decoded filter entry from the untrusted `filters` URL param.
 * Requires string `predicateIri` and `value` (empty allowed — Exists/NotExists carry no value) and a
 * recognised `operator`. `parentIndex` is not validated here: it is optional metadata that the caller
 * coerces to null when it is not a number, so a bad `parentIndex` should not discard an otherwise-valid
 * filter. Everything failing the required checks is dropped.
 */
export function isValidFilterParam(
  s: unknown
): s is { predicateIri: string; operator: Operator; value: string; valueLabel?: unknown; parentIndex?: unknown } {
  if (typeof s !== 'object' || s === null) return false;
  const f = s as Record<string, unknown>;
  return (
    typeof f['predicateIri'] === 'string' &&
    typeof f['value'] === 'string' &&
    typeof f['operator'] === 'string' &&
    VALID_OPERATORS.has(f['operator'])
  );
}

export function encodeFilters(statements: FilterParamInput[]): string {
  return encodeURIComponent(JSON.stringify(statements));
}

export function decodeFilters(raw: string): FilterParam[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return [];
    // The `filters` param is untrusted (bookmarked/shared URLs, hand-edited). Validate each entry
    // against the expected shape and drop anything malformed, so only well-formed filters reach the
    // hydration/query pipeline. This is defence in depth — the Gravsearch writer also escapes values.
    return parsed.filter(isValidFilterParam).map(s => ({
      predicateIri: s.predicateIri,
      operator: s.operator,
      value: s.value,
      // Optional display label for a linked-resource value; only keep a non-empty string.
      valueLabel: typeof s.valueLabel === 'string' && s.valueLabel ? s.valueLabel : undefined,
      parentIndex: typeof s.parentIndex === 'number' ? s.parentIndex : null,
    }));
  } catch {
    return [];
  }
}
