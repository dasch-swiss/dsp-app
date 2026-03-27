import { Constants } from '@dasch-swiss/dsp-js';
import { ResourceLabel } from './constants';
import { Predicate } from './model';

export enum Operator {
  Equals = 'equals',
  NotEquals = 'does not equal',
  Exists = 'exists',
  NotExists = 'does not exist',
  GreaterThan = 'greater than',
  GreaterThanEquals = 'greater than or equal to',
  LessThan = 'less than',
  LessThanEquals = 'less than or equal to',
  IsLike = 'is like',
  Matches = 'matches',
}

const BASIC_OPS = [Operator.Equals, Operator.NotEquals, Operator.Exists, Operator.NotExists];
const TEXT_OPS = [...BASIC_OPS, Operator.IsLike, Operator.Matches];
const NUMERIC_OPS = [
  ...BASIC_OPS,
  Operator.GreaterThan,
  Operator.GreaterThanEquals,
  Operator.LessThan,
  Operator.LessThanEquals,
] as const;
const EXISTENCE_OPS = [Operator.Exists, Operator.NotExists];
const LINKED_RESOURCE_OPS = [...BASIC_OPS, Operator.Matches];

const SPECIAL_VALUE_OPERATORS = {
  [ResourceLabel]: [Operator.Equals, Operator.NotEquals, Operator.IsLike, Operator.Matches],
  [Constants.TextValue]: TEXT_OPS,

  [Constants.IntValue]: NUMERIC_OPS,
  [Constants.DecimalValue]: NUMERIC_OPS,
  [Constants.DateValue]: NUMERIC_OPS,

  [Constants.BooleanValue]: BASIC_OPS,
  [Constants.UriValue]: BASIC_OPS,
  [Constants.ListValue]: BASIC_OPS,
} as const;

export const getOperatorsForObjectType = (property: Predicate) =>
  property.isLinkProperty
    ? (LINKED_RESOURCE_OPS as Operator[])
    : ((SPECIAL_VALUE_OPERATORS[property.objectValueType] ?? EXISTENCE_OPS) as Operator[]);
