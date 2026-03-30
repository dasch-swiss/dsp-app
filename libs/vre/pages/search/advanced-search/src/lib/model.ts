import { Constants } from '@dasch-swiss/dsp-js';
import { v4 as uuidv4 } from 'uuid';
import {
  RDFS_LABEL,
  ResourceLabel,
  MAIN_RESOURCE_PLACEHOLDER,
  RESOURCE_PLACEHOLDER,
  VALUE_SUFFIX,
  RDFS_TYPE,
} from './constants';
import { getOperatorsForObjectType, Operator } from './operators.config';

export enum PropertyObjectType {
  None = 'NONE',
  ValueObject = 'VALUE_OBJECT',
  ListValueObject = 'LIST_VALUE',
  LinkValueObject = 'LINK_VALUE',
  ResourceObject = 'RESOURCE_OBJECT',
}

export interface IriLabelPair {
  iri: string;
  label: string;
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
    return this._value?.label;
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
    public label: string,
    public objectValueType: string,
    public isLinkProperty: boolean,
    public listObjectIri?: string
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

export class OrderByItem {
  orderBy = false;
  constructor(
    public id: string,
    public label?: string,
    public disabled?: boolean
  ) {}
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

export type AdvancedSearchStateSnapshot = SearchFormsState & {
  selectedOntology: IriLabelPair;
  dateOfSnapshot: string;
};

class GravsearchWriterScoped {
  private _id: string;
  private _parentId: string | undefined;
  private _operator;
  private _objectType: string | undefined;
  private _selectedValue: string | undefined;
  private _selectedPredicate: string;

  constructor(
    private _statements: StatementElement[],
    private _index: number
  ) {
    const currentStatement = this._statements[this._index];
    this._id = currentStatement.id;
    this._parentId = currentStatement.parentId;
    this._operator = currentStatement.selectedOperator;
    this._selectedPredicate = currentStatement.selectedPredicate!.iri;
    this._objectType = currentStatement.selectedPredicate?.objectValueType;
    this._selectedValue = currentStatement.selectedObjectWriteValue;
  }

  get isKnoraValueType(): boolean {
    return !!this._objectType && this._objectType.includes(Constants.KnoraApiV2);
  }

  get isLinkValueType(): boolean {
    return !this._objectType?.includes(Constants.KnoraApiV2) && this._objectType !== ResourceLabel;
  }

  get hasChildStatements(): boolean {
    return this._statements.some(stm => stm.parentId === this._id);
  }

  get subject(): string {
    if (!this._parentId) {
      return MAIN_RESOURCE_PLACEHOLDER;
    } // for child statements
    const subjectId = this._parentId || this._id;
    const subjectIndex = this._statements.findIndex(stm => stm.id === subjectId);
    return `${RESOURCE_PLACEHOLDER}${subjectIndex}`;
  }

  get predicate() {
    return this._selectedPredicate === RDFS_LABEL ? RDFS_LABEL : `<${this._selectedPredicate}>`;
  }

  get objectPlaceHolder(): string {
    return `${RESOURCE_PLACEHOLDER}${this._index}`;
  }

  get objectValue(): string {
    return `<${this._selectedValue}>`;
  }

  get objectProjection(): string {
    return `${this.subject} ${this.predicate} ${this.objectPlaceHolder} .\n`;
  }

  get valueProjection(): string {
    return this._objectType === Constants.DateValue
      ? ''
      : `${this.objectPlaceHolder} <${this.valueAsValueIri}> ${this.objectPlaceHolder}${VALUE_SUFFIX} .\n`;
  }

  get constructStatement(): string {
    return this._objectType !== ResourceLabel && this._operator !== Operator.IsLike ? this.objectProjection : '';
  }

  get whereStatement(): string {
    let statement = this.objectProjection;
    if (this._objectType === ResourceLabel) {
      statement += this._whereStatementForLabelComparison();
    } else if (this._objectType === Constants.ListValue) {
      statement += this._getWhereStatementForListObjectComparison();
    } else if (this.isKnoraValueType) {
      statement += this._whereStatementForValueComparison();
    } else if (this.isLinkValueType) {
      statement += this._getWhereStatementForLinkObjectComparison();
    }
    return this._operator === Operator.NotExists ? `FILTER NOT EXISTS { \n${statement}\n}\n` : `${statement}\n`;
  }

  private _whereStatementForValueComparison(): string {
    let whereStm = '';
    if (this._operator !== Operator.Exists && this._operator !== Operator.NotExists) {
      whereStm += this.valueProjection;
      whereStm += this._operator !== Operator.Matches ? this.valueFilterStatement : this.valueMatchStatement;
    }
    return whereStm;
  }

  private _getWhereStatementForLinkObjectComparison(): string {
    let statement = '';
    if (this._operator === Operator.Equals) {
      statement += `${this.subject} ${this.predicate} ${this.objectValue} .\n`;
    }
    if (this._operator === Operator.NotEquals) {
      statement += `FILTER NOT EXISTS { ${this.subject} ${this.predicate} ${this.objectValue} . } \n`;
    }

    if (this._operator === Operator.Matches && !this.hasChildStatements) {
      statement += `${this.objectPlaceHolder} ${RDFS_TYPE} ${this.objectValue} .\n`;
    }

    return statement;
  }

  get valueAsValueIri(): string | undefined {
    switch (this._objectType) {
      case Constants.IntValue:
        return Constants.IntValueAsInt;
      case Constants.TextValue:
        return Constants.ValueAsString;
      case Constants.DateValue:
        return 'dateValueAsSimpleDate';
      case Constants.DecimalValue:
        return Constants.DecimalValueAsDecimal;
      case Constants.UriValue:
        return Constants.UriValueAsUri;
      case Constants.BooleanValue:
        return Constants.BooleanValueAsBoolean;
      default:
        return undefined;
    }
  }

  private _whereStatementForLabelComparison(): string {
    switch (this._operator) {
      case Operator.Equals:
        return `FILTER (${this.objectPlaceHolder} = "${this._selectedValue}") .\n`;
      case Operator.NotEquals:
        return `FILTER (${this.objectPlaceHolder} != "${this._selectedValue}") .\n`;
      case Operator.Matches:
        return `FILTER knora-api:matchLabel(${MAIN_RESOURCE_PLACEHOLDER}, "${this._selectedValue}") .\n`;
      case Operator.IsLike:
        return `FILTER regex(${this.objectPlaceHolder}, "${this._selectedValue}", "i") .\n`;
      default:
        return '';
    }
  }

  private _getWhereStatementForListObjectComparison(): string {
    let whereStm = '';

    if (this._operator === Operator.NotEquals) {
      // This is how the api solves list value not equals
      whereStm += `FILTER NOT EXISTS { ${this.objectPlaceHolder} <${this.valueTypeIri}> <${this._selectedValue}> . }`;
    }
    if (this._operator === Operator.Equals || this._operator === Operator.Matches) {
      whereStm += `${this.objectPlaceHolder} <${this.valueTypeIri}> <${this._selectedValue}> .\n`;
    }
    return whereStm;
  }

  get valueFilterStatement(): string {
    const object =
      this._objectType === Constants.DateValue
        ? `knora-api:toSimpleDate(${this.objectPlaceHolder})`
        : `${this.objectPlaceHolder}${VALUE_SUFFIX}`;
    if (this._operator === Operator.IsLike && this._objectType === Constants.TextValue) {
      return `FILTER regex(${object}, ${this.typedValueLiteral}, "i") .\n`;
    }
    return `FILTER (${object} ${this.operatorSymbol} ${this.typedValueLiteral} ) .\n`;
  }

  get valueMatchStatement(): string {
    return `FILTER knora-api:matchText(${this.objectPlaceHolder}, ${this.typedValueLiteral}) .\n`;
  }

  get typedValueLiteral(): string {
    return `"${this._selectedValue}"^^<${this.valueTypeIri}>`;
  }

  get operatorSymbol(): string {
    switch (this._operator) {
      case Operator.Equals:
        return '=';
      case Operator.NotEquals:
        return '!=';
      case Operator.GreaterThan:
        return '>';
      case Operator.GreaterThanEquals:
        return '>=';
      case Operator.LessThan:
        return '<';
      case Operator.LessThanEquals:
        return '<=';
      case Operator.Exists:
        return 'E';
      case Operator.NotExists:
        return '!E';
      case Operator.IsLike:
        return 'regex';
      case Operator.Matches:
        return Constants.MatchText;
      default:
        return '';
    }
  }

  get valueTypeIri(): string | undefined {
    switch (this._objectType) {
      case Constants.TextValue:
      case `${Constants.KnoraApiV2}#StringValue`:
        return Constants.XsdString;
      case Constants.IntValue:
        return Constants.XsdInteger;
      case Constants.DateValue:
        return `http://api.knora.org/ontology/knora-api/simple/v2${Constants.HashDelimiter}Date`;
      case Constants.DecimalValue:
        return Constants.XsdDecimal;
      case Constants.UriValue:
        return Constants.XsdAnyUri;
      case Constants.BooleanValue:
        return Constants.XsdBoolean;
      case Constants.ListValue:
        return Constants.ListValueAsListNode;
      default:
        return '';
    }
  }
}

export class GravsearchWriter {
  constructor(private _statements: StatementElement[]) {}

  at(index: number): GravsearchWriterScoped {
    return new GravsearchWriterScoped(this._statements, index);
  }
}
