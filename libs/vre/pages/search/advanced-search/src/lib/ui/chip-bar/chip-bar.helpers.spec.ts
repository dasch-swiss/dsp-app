import { Constants } from '@dasch-swiss/dsp-js';
import { NodeValue, Predicate, StatementElement } from '../../model';
import { Operator } from '../../operators.config';

const makeTextPredicate = () => new Predicate('http://ex.org/hasText', 'Title', Constants.TextValue, false);

describe('StatementElement.detachedClone', () => {
  it('creates a new instance with a different id', () => {
    const source = new StatementElement();
    const clone = StatementElement.detachedClone(source);
    expect(clone).not.toBe(source);
    expect(clone.id).not.toBe(source.id);
  });

  it('copies selectedPredicate', () => {
    const source = new StatementElement();
    source.selectedPredicate = makeTextPredicate();
    const clone = StatementElement.detachedClone(source);
    expect(clone.selectedPredicate).toEqual(source.selectedPredicate);
  });

  it('copies selectedOperator', () => {
    const source = new StatementElement();
    source.selectedPredicate = makeTextPredicate();
    source.selectedOperator = Operator.IsLike;
    const clone = StatementElement.detachedClone(source);
    expect(clone.selectedOperator).toBe(Operator.IsLike);
  });

  it('copies string object value', () => {
    const source = new StatementElement();
    source.selectedPredicate = makeTextPredicate();
    source.selectedObjectValue = 'Hamlet';
    const clone = StatementElement.detachedClone(source);
    expect(clone.selectedObjectValue).toBe('Hamlet');
  });

  it('copies IriLabelPair object value', () => {
    const source = new StatementElement();
    source.selectedPredicate = makeTextPredicate();
    source.selectedObjectValue = { iri: 'http://ex.org/res1', label: 'Resource 1' };
    const clone = StatementElement.detachedClone(source);
    expect(clone.selectedObjectValue).toEqual({ iri: 'http://ex.org/res1', label: 'Resource 1' });
  });

  it('copies statementLevel', () => {
    const subject = new NodeValue('stmt-id', { iri: 'http://ex.org/class', label: 'MyClass' });
    const source = new StatementElement(subject, 1);
    const clone = StatementElement.detachedClone(source);
    expect(clone.statementLevel).toBe(1);
  });

  it('produces a pristine clone when source is pristine', () => {
    const source = new StatementElement();
    const clone = StatementElement.detachedClone(source);
    expect(clone.isPristine).toBe(true);
  });
});
