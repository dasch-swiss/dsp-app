import { TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { IriLabelPair, Predicate, StatementElement } from '../../model';
import { Operator } from '../../operators.config';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { ChipLabelPipe } from './chip-label.pipe';

describe('ChipLabelPipe', () => {
  let pipe: ChipLabelPipe;
  // Children by parent id, so the pipe can render subcriteria without a real store.
  let childrenByParent: Map<string, StatementElement[]>;

  const makePredicate = (label: string, objectValueType = Constants.TextValue) =>
    new Predicate('http://ex.org/prop', [{ language: 'en', value: label }], objectValueType, false);

  const makeStatement = (predicateLabel?: string, operator?: Operator, objectValue?: string | IriLabelPair) => {
    const s = new StatementElement();
    if (predicateLabel) {
      s.selectedPredicate = makePredicate(predicateLabel);
    }
    if (operator) s.selectedOperator = operator;
    if (objectValue !== undefined) s.selectedObjectValue = objectValue;
    return s;
  };

  beforeEach(() => {
    childrenByParent = new Map();
    const storeStub: Partial<StatementDraftStore> = {
      childrenOf: (parent: StatementElement) => childrenByParent.get(parent.id) ?? [],
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: LocalizationService, useValue: { currentLanguage: 'en' } },
        { provide: StatementDraftStore, useValue: storeStub },
      ],
    });
    pipe = TestBed.runInInjectionContext(() => new ChipLabelPipe());
  });

  it('returns empty string when no predicate is set', () => {
    const s = new StatementElement();
    expect(pipe.transform(s)).toBe('');
  });

  it('returns predicate label with equals and ellipsis when no value is set', () => {
    const s = makeStatement('Title');
    expect(pipe.transform(s)).toBe('Title equals …');
  });

  it('returns "<predicate> exists" for Exists operator', () => {
    const s = makeStatement('Author', Operator.Exists);
    expect(pipe.transform(s)).toBe('Author exists');
  });

  it('returns "<predicate> does not exist" for NotExists operator', () => {
    const s = makeStatement('Author', Operator.NotExists);
    expect(pipe.transform(s)).toBe('Author does not exist');
  });

  it('wraps value in quotes for IsLike operator', () => {
    const s = makeStatement('Title', Operator.IsLike, 'Hamlet');
    expect(pipe.transform(s)).toBe('Title is like "Hamlet"');
  });

  it('renders Matches value unquoted (targets a class/resource, not a literal)', () => {
    const s = makeStatement('Author', Operator.Matches, 'Person');
    expect(pipe.transform(s)).toBe('Author matches Person');
  });

  it('uses IriLabelPair label for object display', () => {
    const s = makeStatement('Author', Operator.Equals, {
      iri: 'http://ex.org/person1',
      labels: [{ language: 'en', value: 'Shakespeare' }],
      comments: [],
    });
    expect(pipe.transform(s)).toBe('Author equals Shakespeare');
  });

  it('uses string value directly for plain string object', () => {
    const s = makeStatement('Title', Operator.Equals, 'Hamlet');
    expect(pipe.transform(s)).toBe('Title equals Hamlet');
  });

  it('truncates values longer than 20 characters', () => {
    const s = makeStatement('Title', Operator.IsLike, 'A Very Long Title That Exceeds Limit');
    const result = pipe.transform(s);
    expect(result).toContain('…');
    expect(result).toBe('Title is like "A Very Long Title Th…"');
  });

  it('does not truncate values of exactly 20 characters', () => {
    const s = makeStatement('Title', Operator.Equals, '12345678901234567890');
    expect(pipe.transform(s)).toBe('Title equals 12345678901234567890');
  });

  it('truncates values of exactly 21 characters', () => {
    const s = makeStatement('Title', Operator.Equals, '123456789012345678901');
    expect(pipe.transform(s)).toBe('Title equals 12345678901234567890…');
  });

  it('renders NotEquals operator', () => {
    const s = makeStatement('Title', Operator.NotEquals, 'Hamlet');
    expect(pipe.transform(s)).toBe('Title does not equal Hamlet');
  });

  describe('subcriteria', () => {
    it('appends a single subcriterion after "where"', () => {
      const parent = makeStatement('Author', Operator.Matches, 'Person');
      const child = makeStatement('Name', Operator.IsLike, 'Rita');
      childrenByParent.set(parent.id, [child]);

      expect(pipe.transform(parent)).toBe('Author matches Person where (Name is like "Rita")');
    });

    it('joins multiple subcriteria with "and"', () => {
      const parent = makeStatement('Author', Operator.Matches, 'Person');
      const c1 = makeStatement('Name', Operator.IsLike, 'Rita');
      const c2 = makeStatement('Age', Operator.Equals, '30');
      childrenByParent.set(parent.id, [c1, c2]);

      expect(pipe.transform(parent)).toBe('Author matches Person where (Name is like "Rita" and Age equals 30)');
    });

    it('renders nested subcriteria recursively', () => {
      const parent = makeStatement('Author', Operator.Matches, 'Person');
      const child = makeStatement('Editor', Operator.Matches, 'Person');
      const grandchild = makeStatement('Name', Operator.IsLike, 'Rita');
      childrenByParent.set(parent.id, [child]);
      childrenByParent.set(child.id, [grandchild]);

      expect(pipe.transform(parent)).toBe(
        'Author matches Person where (Editor matches Person where (Name is like "Rita"))'
      );
    });

    it('ignores pristine (blank) subcriteria', () => {
      const parent = makeStatement('Author', Operator.Matches, 'Person');
      const blank = new StatementElement();
      childrenByParent.set(parent.id, [blank]);

      expect(pipe.transform(parent)).toBe('Author matches Person');
    });
  });
});
