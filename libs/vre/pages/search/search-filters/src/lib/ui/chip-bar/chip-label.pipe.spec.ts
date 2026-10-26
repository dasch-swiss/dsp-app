import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Constants, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject } from 'rxjs';
import { IriLabelPair, Predicate, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { ListNodeLabelResolver } from '../../service/list-node-label.resolver';
import { OntologyDataService } from '../../service/ontology-data.service';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { ChipLabelPipe } from './chip-label.pipe';

describe('ChipLabelPipe', () => {
  let pipe: ChipLabelPipe;
  // Children by parent id, so the pipe can render subcriteria without a real store.
  let childrenByParent: Map<string, StatementElement[]>;
  let localization: { currentLanguage: string };
  let resourceClasses$: BehaviorSubject<IriLabelPair[]>;
  let listResolverStub: { getLabels: jest.Mock; changes$: BehaviorSubject<void> };

  const makePredicate = (
    label: string,
    objectValueType = Constants.TextValue,
    opts: { isLinkProperty?: boolean; listObjectIri?: string } = {}
  ) =>
    new Predicate(
      'http://ex.org/prop',
      [{ language: 'en', value: label }],
      objectValueType,
      opts.isLinkProperty ?? false,
      opts.listObjectIri
    );

  const makeStatement = (
    predicate?: Predicate,
    operator?: Operator,
    objectValue?: string | IriLabelPair
  ): StatementElement => {
    const s = new StatementElement();
    if (predicate) {
      s.selectedPredicate = predicate;
    }
    if (operator) s.selectedOperator = operator;
    if (objectValue !== undefined) s.selectedObjectValue = objectValue;
    return s;
  };

  // Convenience for the simple text-value cases the pre-existing tests cover.
  const textStatement = (
    predicateLabel?: string,
    operator?: Operator,
    objectValue?: string | IriLabelPair
  ): StatementElement =>
    makeStatement(predicateLabel ? makePredicate(predicateLabel) : undefined, operator, objectValue);

  beforeEach(() => {
    childrenByParent = new Map();
    localization = { currentLanguage: 'en' };
    resourceClasses$ = new BehaviorSubject<IriLabelPair[]>([]);
    listResolverStub = {
      getLabels: jest.fn().mockReturnValue(undefined),
      changes$: new BehaviorSubject<void>(undefined),
    };

    const storeStub: Partial<StatementDraftStore> = {
      childrenOf: (parent: StatementElement) => childrenByParent.get(parent.id) ?? [],
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LocalizationService, useValue: localization },
        { provide: StatementDraftStore, useValue: storeStub },
        { provide: OntologyDataService, useValue: { resourceClasses$ } },
        { provide: ListNodeLabelResolver, useValue: listResolverStub },
        // The pipe injects ChangeDetectorRef to markForCheck() its OnPush host when the resolver
        // reports new data. Outside a real view there is no ambient CDR; a no-op stub is enough.
        { provide: ChangeDetectorRef, useValue: { markForCheck: () => {} } },
      ],
    });
    pipe = TestBed.runInInjectionContext(() => new ChipLabelPipe());
  });

  it('returns empty string when no predicate is set', () => {
    const s = new StatementElement();
    expect(pipe.transform(s)).toBe('');
  });

  it('returns predicate label with equals and ellipsis when no value is set', () => {
    const s = textStatement('Title');
    expect(pipe.transform(s)).toBe('Title equals …');
  });

  it('returns "<predicate> exists" for Exists operator', () => {
    const s = textStatement('Author', Operator.Exists);
    expect(pipe.transform(s)).toBe('Author exists');
  });

  it('returns "<predicate> does not exist" for NotExists operator', () => {
    const s = textStatement('Author', Operator.NotExists);
    expect(pipe.transform(s)).toBe('Author does not exist');
  });

  it('wraps value in quotes for IsLike operator', () => {
    const s = textStatement('Title', Operator.IsLike, 'Hamlet');
    expect(pipe.transform(s)).toBe('Title is like "Hamlet"');
  });

  it('renders Matches value unquoted (targets a class/resource, not a literal)', () => {
    // Matches on a text-value predicate stays the historical shape (resource-class Matches has its own test).
    const s = textStatement('Author', Operator.Matches, 'Person');
    expect(pipe.transform(s)).toBe('Author matches Person');
  });

  it('uses IriLabelPair label for object display', () => {
    const s = textStatement('Author', Operator.Equals, {
      iri: 'http://ex.org/person1',
      labels: [{ language: 'en', value: 'Shakespeare' }],
      comments: [],
    });
    expect(pipe.transform(s)).toBe('Author equals Shakespeare');
  });

  it('uses string value directly for plain string object', () => {
    const s = textStatement('Title', Operator.Equals, 'Hamlet');
    expect(pipe.transform(s)).toBe('Title equals Hamlet');
  });

  it('truncates values longer than 20 characters', () => {
    const s = textStatement('Title', Operator.IsLike, 'A Very Long Title That Exceeds Limit');
    const result = pipe.transform(s);
    expect(result).toContain('…');
    expect(result).toBe('Title is like "A Very Long Title Th…"');
  });

  it('does not truncate values of exactly 20 characters', () => {
    const s = textStatement('Title', Operator.Equals, '12345678901234567890');
    expect(pipe.transform(s)).toBe('Title equals 12345678901234567890');
  });

  it('truncates values of exactly 21 characters', () => {
    const s = textStatement('Title', Operator.Equals, '123456789012345678901');
    expect(pipe.transform(s)).toBe('Title equals 12345678901234567890…');
  });

  it('renders NotEquals operator', () => {
    const s = textStatement('Title', Operator.NotEquals, 'Hamlet');
    expect(pipe.transform(s)).toBe('Title does not equal Hamlet');
  });

  describe('list values (DEV-6857)', () => {
    const LIST_ROOT_IRI = 'http://ex.org/lists/root';
    const NODE_IRI = 'http://ex.org/lists/node/1';
    const multiLangLabels: StringLiteralV2[] = [
      { language: 'de', value: 'Berufs-/Meisterprüfung' },
      { language: 'en', value: 'Professional exam' },
      { language: 'fr', value: 'Examen professionnel' },
    ];

    const makeListStatement = (): StatementElement =>
      makeStatement(
        makePredicate('Field', Constants.ListValue, { listObjectIri: LIST_ROOT_IRI }),
        Operator.Equals,
        // The URL now stores no `valueLabel` for list chips, so the rebuilt IriLabelPair has an empty
        // labels array (see build-statements.ts). The pipe must recover the multi-language labels via
        // the resolver.
        { iri: NODE_IRI, labels: [], comments: [] }
      );

    it('resolves the current-language label from the list-node label resolver', () => {
      listResolverStub.getLabels.mockImplementation((rootIri: string, nodeIri: string) =>
        rootIri === LIST_ROOT_IRI && nodeIri === NODE_IRI ? multiLangLabels : undefined
      );
      const s = makeListStatement();
      expect(pipe.transform(s)).toBe('Field equals Professional exam');
    });

    it('re-translates when the UI language changes', () => {
      listResolverStub.getLabels.mockReturnValue(multiLangLabels);
      const s = makeListStatement();
      expect(pipe.transform(s)).toBe('Field equals Professional exam');

      // The German label from the Linear issue is 22 chars and gets truncated at 20 by the pipe.
      // What matters here is that switching language causes the value to swap to the German source,
      // not that the truncated form matches to the character — the truncation itself is covered above.
      localization.currentLanguage = 'de';
      expect(pipe.transform(s)).toBe('Field equals Berufs-/Meisterprüfu…');
    });

    it('falls back to the raw IRI while the resolver has not yet loaded the tree', () => {
      // Resolver returns undefined (its default) until the fetch completes; the pipe must still render
      // *something* for the chip so it does not collapse to an empty label.
      const s = makeListStatement();
      // The IRI can exceed 20 chars → gets truncated by the pipe's `_truncate` — assert the truncated form.
      expect(pipe.transform(s)).toBe(`Field equals ${NODE_IRI.slice(0, 20)}…`);
    });
  });

  describe('resource-class Matches (DEV-6857)', () => {
    const LINK_PREDICATE_IRI = 'http://ex.org/hasAuthor';
    const CLASS_IRI = 'http://ex.org/onto/Person';
    const classLabels: StringLiteralV2[] = [
      { language: 'de', value: 'Person' },
      { language: 'en', value: 'Person' },
      { language: 'fr', value: 'Personne' },
    ];

    const makeMatchesStatement = (): StatementElement => {
      const s = new StatementElement();
      // A link property's `objectValueType` carries the *target class IRI* (e.g. the "Person" class),
      // NOT the `#LinkValue` type. That's what triggers `objectType === ResourceObject` in the model
      // (see PropertyObjectType branching in model.ts). Using the class IRI here mirrors the real
      // hydration output and lets ChipLabelPipe route to the ontology-labels path.
      s.selectedPredicate = new Predicate(
        LINK_PREDICATE_IRI,
        [
          { language: 'en', value: 'author' },
          { language: 'fr', value: 'auteur' },
        ],
        CLASS_IRI,
        true
      );
      s.selectedOperator = Operator.Matches;
      // Same URL-strip as list values: no valueLabel round-trips, so the IriLabelPair carries only the IRI.
      s.selectedObjectValue = { iri: CLASS_IRI, labels: [], comments: [] };
      return s;
    };

    it('resolves the current-language class label from the ontology cache', () => {
      resourceClasses$.next([{ iri: CLASS_IRI, labels: classLabels, comments: [] }]);
      const s = makeMatchesStatement();
      expect(pipe.transform(s)).toBe('author matches Person');
    });

    it('re-translates when the UI language changes', () => {
      resourceClasses$.next([{ iri: CLASS_IRI, labels: classLabels, comments: [] }]);
      const s = makeMatchesStatement();
      expect(pipe.transform(s)).toBe('author matches Person');

      localization.currentLanguage = 'fr';
      expect(pipe.transform(s)).toBe('auteur matches Personne');
    });
  });

  describe('subcriteria', () => {
    it('appends a single subcriterion after "where"', () => {
      const parent = textStatement('Author', Operator.Matches, 'Person');
      const child = textStatement('Name', Operator.IsLike, 'Rita');
      childrenByParent.set(parent.id, [child]);

      expect(pipe.transform(parent)).toBe('Author matches Person where (Name is like "Rita")');
    });

    it('joins multiple subcriteria with "and"', () => {
      const parent = textStatement('Author', Operator.Matches, 'Person');
      const c1 = textStatement('Name', Operator.IsLike, 'Rita');
      const c2 = textStatement('Age', Operator.Equals, '30');
      childrenByParent.set(parent.id, [c1, c2]);

      expect(pipe.transform(parent)).toBe('Author matches Person where (Name is like "Rita" and Age equals 30)');
    });

    it('renders nested subcriteria recursively', () => {
      const parent = textStatement('Author', Operator.Matches, 'Person');
      const child = textStatement('Editor', Operator.Matches, 'Person');
      const grandchild = textStatement('Name', Operator.IsLike, 'Rita');
      childrenByParent.set(parent.id, [child]);
      childrenByParent.set(child.id, [grandchild]);

      expect(pipe.transform(parent)).toBe(
        'Author matches Person where (Editor matches Person where (Name is like "Rita"))'
      );
    });

    it('ignores pristine (blank) subcriteria', () => {
      const parent = textStatement('Author', Operator.Matches, 'Person');
      const blank = new StatementElement();
      childrenByParent.set(parent.id, [blank]);

      expect(pipe.transform(parent)).toBe('Author matches Person');
    });
  });
});
