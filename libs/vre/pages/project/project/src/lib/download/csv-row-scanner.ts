export type RowScannerState = { inQuotes: boolean; cursor: number; rows: number };

export function initRowScanner(): RowScannerState {
  return { inQuotes: false, cursor: 0, rows: 0 };
}

/**
 * Advances the scanner over the new suffix of a cumulative partialText string.
 * Counts \n characters that are not inside quoted fields (RFC 4180).
 * Assumes partialText grows monotonically across DownloadProgress events.
 */
export function advanceRowScanner(state: RowScannerState, partialText: string): RowScannerState {
  // Defensive guard: if partialText shrank (unexpected Angular behaviour change),
  // reset and re-scan from the beginning — correct but O(n^2) for that frame.
  let { inQuotes, cursor, rows } = partialText.length < state.cursor ? { inQuotes: false, cursor: 0, rows: 0 } : state;

  for (let i = cursor; i < partialText.length; i++) {
    const c = partialText[i];
    if (c === '"') {
      // RFC 4180 doubled-quote escape ("") toggles twice → no-op, which is correct.
      inQuotes = !inQuotes;
    } else if (c === '\n' && !inQuotes) {
      rows++;
    }
  }
  return { inQuotes, cursor: partialText.length, rows };
}
