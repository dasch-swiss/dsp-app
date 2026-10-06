import { decodeFilters, encodeFilters, FilterParam } from './filter-params.codec';
import { Operator } from './operators.config';

/**
 * The codec is the one piece of filter handling shared verbatim across every page that hosts the chip
 * bar, so a link written by one page must decode identically on another. These lock that contract.
 *
 * Note on the percent cases: `decodeFilters` calls `decodeURIComponent` on a value the Router has
 * already decoded once, which looks like a double-decode bug. It is not — `encodeFilters` applies the
 * matching `encodeURIComponent`, and the Router's own encode/decode is a separate, also symmetric
 * layer. Investigated during DEV-7453; these cases exist so a future reader does not "fix" it.
 */
describe('filter params codec', () => {
  const filter = (value: string): Parameters<typeof encodeFilters>[0][number] => ({
    predicateIri: 'http://example.org/onto#hasTitle',
    operator: Operator.Equals,
    value,
  });

  it.each([
    ['a literal percent', '50% cotton'],
    ['a percent-encoding lookalike', '%20 is a space'],
    ['quotes, backslashes and ampersands', 'quote " backslash \\ ampersand &'],
    ['a plus sign', 'rock + roll'],
    ['non-latin text', 'Wörterbuch der Gegenwartssprache'],
  ])('round-trips %s', (_label, value) => {
    expect(decodeFilters(encodeFilters([filter(value)]))[0].value).toBe(value);
  });

  it('normalises a missing parentIndex to null so top-level filters decode consistently', () => {
    const decoded: FilterParam[] = decodeFilters(encodeFilters([filter('x')]));
    expect(decoded[0].parentIndex).toBeNull();
  });

  it('preserves parent links across the round trip', () => {
    const encoded = encodeFilters([filter('parent'), { ...filter('child'), parentIndex: 0 }]);
    expect(decodeFilters(encoded).map(f => f.parentIndex)).toEqual([null, 0]);
  });

  it('drops a malformed entry rather than the whole set', () => {
    const raw = encodeURIComponent(
      JSON.stringify([{ predicateIri: 'http://x/p', operator: Operator.Equals, value: 'kept' }, { nonsense: true }])
    );
    const decoded = decodeFilters(raw);
    expect(decoded).toHaveLength(1);
    expect(decoded[0].value).toBe('kept');
  });

  it('returns an empty set for input that is not JSON at all', () => {
    expect(decodeFilters('not-json')).toEqual([]);
  });
});
