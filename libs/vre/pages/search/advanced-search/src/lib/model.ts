import { Constants, StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { v4 as uuidv4 } from 'uuid';
import { getOperatorsForObjectType, Operator } from './operators.config';

/**
 * Escape a user-supplied IsLike value for safe embedding inside a Gravsearch
 * FILTER regex(…) call. We do NOT escape regex metacharacters — IsLike is a
 * regex field, so users can type `.`, `*`, `(`, etc. and have them reach the
 * regex engine as metacharacters. To match a literal metacharacter the user
 * escapes it themselves (`\*` for a literal asterisk), exactly as in SPARQL.
 *
 * Two string-escape layers stand between the HTTP body and the regex engine
 * (verified empirically against api.dev.dasch.swiss). To deliver one literal
 * `\` to the regex engine (so the user's `\*` reaches the regex as `\*` and
 * matches a literal `*`), the wire must carry four backslashes. The double
 * quote `"` is not a regex metacharacter, so it only needs to survive the
 * two string layers — three backslashes + quote on the wire.
 */
export function escapeForGravsearchStringLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\\\\\').replace(/"/g, '\\\\\\"');
}

/**
 * Escape a user-supplied value for embedding inside a plain, double-quoted SPARQL/Gravsearch string
 * literal (`"…"`) — the value comparison and label FILTER paths, NOT the regex(…) path (use
 * {@link escapeForGravsearchStringLiteral} there). Escapes backslash, double quote, and the newline/
 * carriage-return/tab control characters, so a value can never close the literal and inject query
 * structure. Values reach here from the URL `filters` param, so treat them as untrusted.
 */
export function escapeSparqlStringLiteral(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Sanitize a user-supplied value for embedding inside a SPARQL IRI reference (`<…>`) — the link- and
 * list-object comparison paths. A SPARQL IRIREF cannot contain any of `<>"{}|^\`` , backtick, space,
 * or control characters; percent-encode those so the value can never close the `<…>` and inject
 * structure. Well-formed IRIs (the normal picker-selected case) pass through unchanged.
 */
export function sanitizeSparqlIri(value: string): string {
  // Illegal in a SPARQL IRIREF: < > " { } | ^ ` \\, plus space and every control char
  // (0x00-0x20). Percent-encode them so the value can never close the <...> and inject structure.
  /* eslint-disable-next-line no-control-regex */
  const illegalIriChars = /[<>"{}|^`\\\u0000-\u0020]/g;
  return value.replace(illegalIriChars, ch => `%${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);
}

export enum PropertyObjectType {
  None = 'NONE',
  ValueObject = 'VALUE_OBJECT',
  ListValueObject = 'LIST_VALUE',
  LinkValueObject = 'LINK_VALUE',
  ResourceObject = 'RESOURCE_OBJECT',
}

export interface IriLabelPair {
  iri: string;
  labels: StringLiteralV2[];
  comments: StringLiteralV2[];
}

abstract class StatementValue {
  constructor(public statementId: string) {}
  abstract get writeValue(): string | undefined;
}

export class NodeValue extends StatementValue {
  constructor(
    statementId: string,
    private readonly _value?: IriLabelPair
  ) {
    super(statementId);
  }

  get value(): IriLabelPair | undefined {
    return this._value;
  }

  get label(): string | undefined {
    return this._value?.labels.find(l => l.value && l.value.trim() !== '')?.value;
  }

  get writeValue(): string | undefined {
    return this._value?.iri;
  }
}

export class StringValue extends StatementValue {
  constructor(
    statementId: string,
    private readonly _value?: string
  ) {
    super(statementId);
  }

  get value(): string | undefined {
    return this._value;
  }

  get writeValue(): string | undefined {
    return this._value;
  }
}

export class Predicate implements IriLabelPair {
  constructor(
    public iri: string,
    public labels: StringLiteralV2[],
    public objectValueType: string,
    public isLinkProperty: boolean,
    public listObjectIri?: string,
    public comments: StringLiteralV2[] = []
  ) {}
}

export class StatementElement {
  readonly id = uuidv4();
  private _subjectNode?: NodeValue;
  private _selectedPredicate?: Predicate;
  private _selectedOperator?: Operator;
  private _selectedObjectNode?: NodeValue | StringValue;
  private _parentStatement?: StatementElement;
  statementLevel = 0;

  constructor(subjectNode?: NodeValue, statementLevel = 0, parentStatement?: StatementElement) {
    this._subjectNode = subjectNode;
    this.statementLevel = statementLevel;
    this._parentStatement = parentStatement;
  }

  get subjectNode(): NodeValue | undefined {
    return this._subjectNode;
  }

  get selectedPredicate(): Predicate | undefined {
    return this._selectedPredicate;
  }

  set selectedPredicate(prop: Predicate) {
    this._selectedPredicate = prop;
    this._selectedOperator = Operator.Equals;
    this._selectedObjectNode = undefined;
  }

  get selectedOperator(): Operator | undefined {
    return this._selectedOperator;
  }

  set selectedOperator(operator: Operator) {
    if (this._operatorChangeMustResetObject(operator)) {
      this._selectedObjectNode = undefined;
    }
    this._selectedOperator = operator;
  }

  get selectedObjectNode(): NodeValue | StringValue | undefined {
    return this._selectedObjectNode;
  }

  set selectedObjectNode(value: StringValue | NodeValue | undefined) {
    this._selectedObjectNode = value;
  }

  get selectedObjectValue(): string | IriLabelPair | undefined {
    if (this._selectedObjectNode instanceof StringValue) {
      return this._selectedObjectNode.value;
    }
    if (this._selectedObjectNode instanceof NodeValue) {
      return this._selectedObjectNode.value;
    }
    return undefined;
  }

  set selectedObjectValue(value: string | IriLabelPair) {
    if (typeof value === 'string') {
      this._selectedObjectNode = new StringValue(this.id, value);
    } else {
      this._selectedObjectNode = new NodeValue('', value);
    }
  }

  get selectedObjectWriteValue(): string | undefined {
    return this._selectedObjectNode?.writeValue;
  }

  get operators(): Operator[] {
    return this._selectedPredicate ? getOperatorsForObjectType(this._selectedPredicate) : [];
  }

  get isPristine(): boolean {
    return !this.selectedPredicate && !this.selectedOperator && !this.selectedObjectNode;
  }

  get isValidAndComplete(): boolean {
    return (
      this.selectedOperator === Operator.Exists ||
      this.selectedOperator === Operator.NotExists ||
      !!this.selectedObjectNode?.writeValue
    );
  }

  get objectType(): PropertyObjectType {
    if (
      !this.selectedOperator ||
      this.selectedOperator === Operator.Exists ||
      this.selectedOperator === Operator.NotExists
    ) {
      return PropertyObjectType.None;
    }
    if (
      !this.selectedPredicate?.objectValueType?.includes(Constants.KnoraApiV2) &&
      this.selectedOperator === Operator.Matches
    ) {
      return PropertyObjectType.ResourceObject;
    }

    if (this.selectedPredicate?.isLinkProperty && this.selectedOperator !== Operator.Matches) {
      return PropertyObjectType.LinkValueObject;
    }

    if (this.selectedPredicate?.objectValueType === Constants.ListValue) {
      return PropertyObjectType.ListValueObject;
    }
    return PropertyObjectType.ValueObject;
  }

  clearSelections() {
    this._selectedPredicate = undefined;
    this._selectedOperator = undefined;
    this._selectedObjectNode = undefined;
  }

  static detachedClone(source: StatementElement): StatementElement {
    const clone = new StatementElement(source.subjectNode, source.statementLevel);
    if (source.selectedPredicate) clone.selectedPredicate = source.selectedPredicate;
    if (source.selectedOperator) clone.selectedOperator = source.selectedOperator;
    if (source.selectedObjectValue !== undefined) clone.selectedObjectValue = source.selectedObjectValue;
    return clone;
  }

  get parentId(): string | undefined {
    return this._parentStatement?.id;
  }

  private _operatorChangeMustResetObject(operatorToSet: Operator): boolean {
    if (
      // for value objects, any operator change except a change to exist or not exist must not reset the object value
      this.objectType === 'VALUE_OBJECT' &&
      operatorToSet !== Operator.Exists &&
      operatorToSet !== Operator.NotExists
    ) {
      return false;
    }

    if (
      // switching between equals and not equals must not reset the object
      (operatorToSet === Operator.Equals && this._selectedOperator === Operator.NotEquals) ||
      (operatorToSet === Operator.NotEquals && this._selectedOperator === Operator.Equals)
    ) {
      return false;
    }
    return true;
  }
}

export type OrderDirection = 'asc' | 'desc';

export class OrderByItem {
  constructor(
    public readonly id: string,
    public readonly labels: StringLiteralV2[] = [],
    public readonly disabled?: boolean,
    public readonly orderBy = false,
    /** Sort direction; only meaningful while `orderBy` is true. Defaults to ascending. */
    public readonly direction: OrderDirection = 'asc'
  ) {}

  /** Immutable update: returns a new item with the given active flag, preserving id/labels/disabled/direction. */
  withOrderBy(orderBy: boolean): OrderByItem {
    return new OrderByItem(this.id, this.labels, this.disabled, orderBy, this.direction);
  }

  /** Immutable update: returns a new item with the given sort direction, preserving everything else. */
  withDirection(direction: OrderDirection): OrderByItem {
    return new OrderByItem(this.id, this.labels, this.disabled, this.orderBy, direction);
  }
}

export interface QueryObject {
  query: string;
  properties: StatementElement[];
}

export interface SearchFormsState {
  selectedResourceClass: IriLabelPair;
  statementElements: StatementElement[];
  orderBy: OrderByItem[];
}
