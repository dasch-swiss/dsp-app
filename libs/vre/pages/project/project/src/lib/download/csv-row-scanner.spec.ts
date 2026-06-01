import { advanceRowScanner, initRowScanner } from './csv-row-scanner';

describe('csv-row-scanner', () => {
  describe('initRowScanner', () => {
    it('returns zero state', () => {
      expect(initRowScanner()).toEqual({ inQuotes: false, cursor: 0, rows: 0 });
    });
  });

  describe('advanceRowScanner', () => {
    it('empty input — rows stays 0', () => {
      const state = advanceRowScanner(initRowScanner(), '');
      expect(state.rows).toBe(0);
      expect(state.inQuotes).toBe(false);
    });

    it('simple rows — counts each \\n', () => {
      const state = advanceRowScanner(initRowScanner(), 'a,b\nc,d\ne,f\n');
      expect(state.rows).toBe(3);
    });

    it('quoted-field newline is not a row boundary', () => {
      const state = advanceRowScanner(initRowScanner(), 'a,"b\nc",d\n');
      expect(state.rows).toBe(1);
    });

    it('doubled-quote escape ("") toggles inQuotes twice — scanner ends not-in-quotes', () => {
      const state = advanceRowScanner(initRowScanner(), 'a,"b""c",d\n');
      expect(state.rows).toBe(1);
      expect(state.inQuotes).toBe(false);
    });

    it('incremental: feeds two partial texts and advances cursor correctly', () => {
      let state = initRowScanner();
      state = advanceRowScanner(state, 'a,b\nc,');
      expect(state.rows).toBe(1);
      expect(state.cursor).toBe(6);

      state = advanceRowScanner(state, 'a,b\nc,d\ne,f\n');
      expect(state.rows).toBe(3);
      expect(state.cursor).toBe(12);
    });

    it('defensive shrink: resets and re-scans when partialText is shorter than cursor', () => {
      let state = advanceRowScanner(initRowScanner(), 'a,b\nc,d\n');
      expect(state.rows).toBe(2);

      // Feed a shorter string — simulates an unexpected Angular regression
      state = advanceRowScanner(state, 'a,b\n');
      expect(state.rows).toBe(1);
      expect(state.rows).toBeGreaterThanOrEqual(0);
    });
  });
});
