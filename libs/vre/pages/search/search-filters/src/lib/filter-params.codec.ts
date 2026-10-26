import { Operator } from './operators.config';

/** The wire shape of one confirmed filter in a URL; it must stay identical across every page hosting the chip bar. */
export interface FilterParam {
  parentIndex: number | null;
  predicateIri: string;
  operator: Operator;
  value: string;
  /**
   * Display label for a linked-resource `value` (its IRI), written only for link-value chips. List values and
   * resource-class `Matches` chips must not populate it: `ChipLabelPipe` resolves their labels at render time,
   * and persisting one would fossilise the writer's language.
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
 * Validates one decoded entry of the untrusted `filters` param: string `predicateIri` and `value` (empty
 * allowed for Exists/NotExists) and a recognised `operator`. `parentIndex` is not checked; the caller
 * coerces it to null.
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
    // The `filters` param is untrusted (shared or hand-edited URLs): drop malformed entries before hydration.
    // Defence in depth — the Gravsearch writer also escapes values.
    return parsed.filter(isValidFilterParam).map(s => ({
      predicateIri: s.predicateIri,
      operator: s.operator,
      value: s.value,
      valueLabel: typeof s.valueLabel === 'string' && s.valueLabel ? s.valueLabel : undefined,
      parentIndex: typeof s.parentIndex === 'number' ? s.parentIndex : null,
    }));
  } catch {
    return [];
  }
}
