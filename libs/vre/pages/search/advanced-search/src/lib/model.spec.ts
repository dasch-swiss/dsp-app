import { Constants } from '@dasch-swiss/dsp-js';
import { NodeValue, Predicate, StatementElement, StringValue } from './model';
import { Operator } from './operators.config';

const makeTextPredicate = (label = 'Title') =>
  new Predicate('http://ex.org/hasText', label, Constants.TextValue, false);

const makeLinkPredicate = () =>
  new Predicate('http://ex.org/hasLink', 'Linked Resource', 'http://ex.org/OtherClass', true);

const makeListPredicate = () => new Predicate('http://ex.org/hasList', 'Category', Constants.ListValue, false);

describe('StatementElement', () => {
  describe('isPristine', () => {
    it('is true when nothing is set', () => {
      const s = new StatementElement();
      expect(s.isPristine).toBe(true);
    });

    it('is false after a predicate is selected', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      expect(s.isPristine).toBe(false);
    });
  });

  describe('selectedPredicate setter', () => {
    it('auto-sets selectedOperator to Equals', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      expect(s.selectedOperator).toBe(Operator.Equals);
    });

    it('clears selectedObjectNode when predicate changes', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedObjectValue = 'Hamlet';
      s.selectedPredicate = makeTextPredicate('Author');
      expect(s.selectedObjectValue).toBeUndefined();
    });
  });

  describe('isValidAndComplete', () => {
    it('is false when pristine', () => {
      const s = new StatementElement();
      expect(s.isValidAndComplete).toBe(false);
    });

    it('is true for Exists operator without value', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedOperator = Operator.Exists;
      expect(s.isValidAndComplete).toBe(true);
    });

    it('is true for NotExists operator without value', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedOperator = Operator.NotExists;
      expect(s.isValidAndComplete).toBe(true);
    });

    it('is true when operator and object value are set', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedObjectValue = 'Hamlet';
      expect(s.isValidAndComplete).toBe(true);
    });

    it('is false when object value is not set for Equals operator', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      // Equals is auto-set, no value
      expect(s.isValidAndComplete).toBe(false);
    });
  });

  describe('objectType', () => {
    it('returns None when no operator is set', () => {
      const s = new StatementElement();
      expect(s.objectType).toBe('NONE');
    });

    it('returns None for Exists operator', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedOperator = Operator.Exists;
      expect(s.objectType).toBe('NONE');
    });

    it('returns None for NotExists operator', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedOperator = Operator.NotExists;
      expect(s.objectType).toBe('NONE');
    });

    it('returns VALUE_OBJECT for text predicate with Equals operator', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      expect(s.objectType).toBe('VALUE_OBJECT');
    });

    it('returns LINK_VALUE for link predicate with non-Matches operator', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeLinkPredicate();
      expect(s.objectType).toBe('LINK_VALUE');
    });

    it('returns RESOURCE_OBJECT for link predicate with Matches operator', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeLinkPredicate();
      s.selectedOperator = Operator.Matches;
      expect(s.objectType).toBe('RESOURCE_OBJECT');
    });

    it('returns LIST_VALUE for list predicate', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeListPredicate();
      expect(s.objectType).toBe('LIST_VALUE');
    });
  });

  describe('selectedOperator setter - object reset behavior', () => {
    it('clears object when switching from Equals to Exists', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedObjectValue = 'Hamlet';
      s.selectedOperator = Operator.Exists;
      expect(s.selectedObjectValue).toBeUndefined();
    });

    it('preserves object when switching between Equals and NotEquals for value types', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedObjectValue = 'Hamlet';
      s.selectedOperator = Operator.NotEquals;
      expect(s.selectedObjectValue).toBe('Hamlet');
    });

    it('preserves object when switching between NotEquals and Equals for value types', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedObjectValue = 'Hamlet';
      s.selectedOperator = Operator.NotEquals;
      s.selectedOperator = Operator.Equals;
      expect(s.selectedObjectValue).toBe('Hamlet');
    });

    it('preserves object when switching between IsLike and other non-existence operators for value types', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedObjectValue = 'Hamlet';
      s.selectedOperator = Operator.IsLike;
      expect(s.selectedObjectValue).toBe('Hamlet');
    });
  });

  describe('selectedObjectValue', () => {
    it('stores and returns string values', () => {
      const s = new StatementElement();
      s.selectedObjectValue = 'test';
      expect(s.selectedObjectValue).toBe('test');
      expect(s.selectedObjectNode).toBeInstanceOf(StringValue);
    });

    it('stores and returns IriLabelPair values', () => {
      const s = new StatementElement();
      const pair = { iri: 'http://ex.org/res1', label: 'Resource 1' };
      s.selectedObjectValue = pair;
      expect(s.selectedObjectValue).toEqual(pair);
      expect(s.selectedObjectNode).toBeInstanceOf(NodeValue);
    });

    it('selectedObjectWriteValue returns the IRI for IriLabelPair', () => {
      const s = new StatementElement();
      s.selectedObjectValue = { iri: 'http://ex.org/res1', label: 'Resource 1' };
      expect(s.selectedObjectWriteValue).toBe('http://ex.org/res1');
    });

    it('selectedObjectWriteValue returns the string for string value', () => {
      const s = new StatementElement();
      s.selectedObjectValue = 'Hamlet';
      expect(s.selectedObjectWriteValue).toBe('Hamlet');
    });
  });

  describe('clearSelections', () => {
    it('resets all selections to undefined', () => {
      const s = new StatementElement();
      s.selectedPredicate = makeTextPredicate();
      s.selectedObjectValue = 'Hamlet';
      s.clearSelections();
      expect(s.selectedPredicate).toBeUndefined();
      expect(s.selectedOperator).toBeUndefined();
      expect(s.selectedObjectValue).toBeUndefined();
      expect(s.isPristine).toBe(true);
    });
  });
});
