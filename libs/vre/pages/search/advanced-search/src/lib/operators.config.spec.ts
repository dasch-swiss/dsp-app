import { Constants } from '@dasch-swiss/dsp-js';
import { ResourceLabel } from './constants';
import { Predicate } from './model';
import { getOperatorsForObjectType, Operator } from './operators.config';

const makeTextPredicate = () => new Predicate('http://ex.org/prop', 'Title', Constants.TextValue, false);
const makeIntPredicate = () => new Predicate('http://ex.org/prop', 'Count', Constants.IntValue, false);
const makeDecimalPredicate = () => new Predicate('http://ex.org/prop', 'Amount', Constants.DecimalValue, false);
const makeDatePredicate = () => new Predicate('http://ex.org/prop', 'Created', Constants.DateValue, false);
const makeListPredicate = () => new Predicate('http://ex.org/prop', 'Category', Constants.ListValue, false);
const makeBooleanPredicate = () => new Predicate('http://ex.org/prop', 'Active', Constants.BooleanValue, false);
const makeUriPredicate = () => new Predicate('http://ex.org/prop', 'Website', Constants.UriValue, false);
const makeLinkPredicate = () => new Predicate('http://ex.org/prop', 'Linked', 'http://ex.org/OtherClass', true);
const makeLabelPredicate = () => new Predicate(ResourceLabel, 'Label', ResourceLabel, false);

describe('getOperatorsForObjectType', () => {
  it('includes IsLike and Matches for TextValue', () => {
    const ops = getOperatorsForObjectType(makeTextPredicate());
    expect(ops).toContain(Operator.IsLike);
    expect(ops).toContain(Operator.Matches);
  });

  it('includes comparison operators for IntValue', () => {
    const ops = getOperatorsForObjectType(makeIntPredicate());
    expect(ops).toContain(Operator.GreaterThan);
    expect(ops).toContain(Operator.LessThan);
    expect(ops).toContain(Operator.GreaterThanEquals);
    expect(ops).toContain(Operator.LessThanEquals);
  });

  it('includes comparison operators for DecimalValue', () => {
    const ops = getOperatorsForObjectType(makeDecimalPredicate());
    expect(ops).toContain(Operator.GreaterThan);
  });

  it('includes comparison operators for DateValue', () => {
    const ops = getOperatorsForObjectType(makeDatePredicate());
    expect(ops).toContain(Operator.GreaterThan);
    expect(ops).toContain(Operator.LessThan);
  });

  it('does not include IsLike for IntValue', () => {
    const ops = getOperatorsForObjectType(makeIntPredicate());
    expect(ops).not.toContain(Operator.IsLike);
  });

  it('includes only basic operators for ListValue', () => {
    const ops = getOperatorsForObjectType(makeListPredicate());
    expect(ops).toContain(Operator.Equals);
    expect(ops).toContain(Operator.NotEquals);
    expect(ops).not.toContain(Operator.IsLike);
    expect(ops).not.toContain(Operator.GreaterThan);
  });

  it('includes only basic operators for BooleanValue', () => {
    const ops = getOperatorsForObjectType(makeBooleanPredicate());
    expect(ops).toContain(Operator.Equals);
    expect(ops).not.toContain(Operator.IsLike);
    expect(ops).not.toContain(Operator.GreaterThan);
  });

  it('includes only basic operators for UriValue', () => {
    const ops = getOperatorsForObjectType(makeUriPredicate());
    expect(ops).toContain(Operator.Equals);
    expect(ops).not.toContain(Operator.IsLike);
  });

  it('includes Matches operator for link properties', () => {
    const ops = getOperatorsForObjectType(makeLinkPredicate());
    expect(ops).toContain(Operator.Matches);
    expect(ops).toContain(Operator.Equals);
  });

  it('does not include comparison operators for link properties', () => {
    const ops = getOperatorsForObjectType(makeLinkPredicate());
    expect(ops).not.toContain(Operator.GreaterThan);
    expect(ops).not.toContain(Operator.IsLike);
  });

  it('includes IsLike and Matches for label (ResourceLabel) predicate', () => {
    const ops = getOperatorsForObjectType(makeLabelPredicate());
    expect(ops).toContain(Operator.IsLike);
    expect(ops).toContain(Operator.Matches);
  });

  it('does not include GreaterThan for label predicate', () => {
    const ops = getOperatorsForObjectType(makeLabelPredicate());
    expect(ops).not.toContain(Operator.GreaterThan);
  });

  it('does not include Exists or NotExists for label predicate', () => {
    const ops = getOperatorsForObjectType(makeLabelPredicate());
    expect(ops).not.toContain(Operator.Exists);
    expect(ops).not.toContain(Operator.NotExists);
  });

  it('returns Exists and NotExists for unknown value type', () => {
    const unknown = new Predicate('http://ex.org/prop', 'Unknown', 'http://ex.org/UnknownType', false);
    const ops = getOperatorsForObjectType(unknown);
    expect(ops).toContain(Operator.Exists);
    expect(ops).toContain(Operator.NotExists);
    expect(ops).not.toContain(Operator.Equals);
  });
});
