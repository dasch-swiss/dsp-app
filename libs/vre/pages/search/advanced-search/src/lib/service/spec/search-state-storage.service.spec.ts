import { readFileSync } from 'fs';
import { resolve } from 'path';
import { TestBed } from '@angular/core/testing';
import { IriLabelPair, StatementElement } from '../../model';
import { SearchStateStorageService } from '../search-state-storage.service';

/**
 * Acceptance specs for the passive-storage contract of DEV-6645.
 *
 * Asserts that:
 *   1. `SearchStateStorageService` does NOT depend on `LocalizationService`
 *      or `TranslateService` — it round-trips raw snapshots without
 *      language-aware logic. Verified via static source-code analysis so
 *      future refactors cannot silently break the contract.
 *   2. Reconstructing a legacy snapshot whose predicates carry the old
 *      single-language shape does not crash (graceful degradation).
 *   3. `storeSearchSnapshot` persists whatever the caller provided without
 *      flattening or normalising labels arrays.
 */

describe('SearchStateStorageService — passive contract (DEV-6645)', () => {
  let service: SearchStateStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchStateStorageService],
    });
    service = TestBed.inject(SearchStateStorageService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('static source analysis', () => {
    /**
     * The plan mandates that storage stays passive: no LocalizationService,
     * no TranslateService, no label-normalisation helpers. Reading the
     * source verbatim and asserting on its import surface is the cheapest
     * way to keep that contract honest across refactors.
     */
    it('does not import LocalizationService or TranslateService', () => {
      const sourcePath = resolve(__dirname, '../search-state-storage.service.ts');
      const source = readFileSync(sourcePath, 'utf8');

      expect(source).not.toMatch(/LocalizationService/);
      expect(source).not.toMatch(/TranslateService/);
      expect(source).not.toMatch(/pickPreferredLanguageString/);
      expect(source).not.toMatch(/labelsFromI18n/);
    });
  });

  describe('snapshot round-trip', () => {
    it('persists the labels array exactly as provided (no flattening)', () => {
      const labels = [
        { language: 'en', value: 'Book' },
        { language: 'de', value: 'Buch' },
      ];
      const ontology: IriLabelPair = {
        iri: 'http://example/ontology',
        labels: [{ language: 'en', value: 'Ontology' }],
        comments: [],
      };
      const selectedResourceClass: IriLabelPair = {
        iri: 'http://example/Book',
        labels,
        comments: [],
      };

      service.storeSearchSnapshot('q1', ontology, {
        selectedResourceClass,
        statementElements: [],
        orderBy: [],
      });

      const stored = JSON.parse(localStorage.getItem('advanced-search-global')!);
      expect(stored.q1.selectedResourceClass.labels).toEqual(labels);
      expect(stored.q1.selectedOntology.labels).toEqual(ontology.labels);
    });

    it('reconstructs statements from a snapshot without crashing on legacy single-language predicates', () => {
      // Legacy snapshots persisted before DEV-6645 had predicates shaped as
      // { iri, label: string }. The service should round-trip such snapshots
      // without throwing — even if downstream consumers reshape the data.
      const legacySnapshot = {
        q1: {
          selectedOntology: { iri: 'http://example/ontology', label: 'Onto' },
          selectedResourceClass: { iri: 'http://example/Book', label: 'Book' },
          statementElements: [
            {
              id: 'stmt-1',
              statementLevel: 0,
              _subjectNode: { _value: { iri: 'http://example/Book', label: 'Book' } },
              _selectedPredicate: {
                iri: 'http://example/hasAuthor',
                label: 'has author',
                objectValueType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
                isLinkProperty: false,
              },
              _selectedOperator: 'Equals',
              _selectedObjectNode: { statementId: 'stmt-1', _value: 'Goethe' },
            },
          ],
          orderBy: [],
          dateOfSnapshot: new Date().toISOString(),
        },
      };
      localStorage.setItem('advanced-search-global', JSON.stringify(legacySnapshot));

      expect(() => service.getPreviousSearchForQuery('q1')).not.toThrow();

      const restored = service.getPreviousSearchForQuery('q1');
      expect(restored).toBeDefined();
      expect(restored!.statementElements).toHaveLength(1);
      expect(restored!.statementElements[0]).toBeInstanceOf(StatementElement);
    });
  });
});
