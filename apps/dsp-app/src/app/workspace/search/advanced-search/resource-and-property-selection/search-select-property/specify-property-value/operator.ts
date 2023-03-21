import { ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { ComparisonOperatorConstants } from './operator-constants';

/**
 * an abstract interface representing a comparison operator.
 * This interface is implemented for the supported comparison operators.
 */
export interface ComparisonOperator {
    // type of comparison operator
    type: string;

    // the label of the comparison operator to be presented to the user.
    label: string;

    // returns the class name when called on an instance
    getClassName(): string;
}

export class Equals implements ComparisonOperator {
    type = ComparisonOperatorConstants.EqualsComparisonOperator;
    label = ComparisonOperatorConstants.EqualsComparisonLabel;

    constructor() {}

    getClassName() {
        return 'Equals';
    }
}

export class NotEquals implements ComparisonOperator {
    type = ComparisonOperatorConstants.NotEqualsComparisonOperator;
    label = ComparisonOperatorConstants.NotEqualsComparisonLabel;

    constructor() {}

    getClassName() {
        return 'NotEquals';
    }
}

export class GreaterThanEquals implements ComparisonOperator {
    type = ComparisonOperatorConstants.GreaterThanEqualsComparisonOperator;
    label = ComparisonOperatorConstants.GreaterThanEqualsComparisonLabel;

    constructor() {}

    getClassName() {
        return 'GreaterThanEquals';
    }
}

export class GreaterThan implements ComparisonOperator {
    type = ComparisonOperatorConstants.GreaterThanComparisonOperator;
    label = ComparisonOperatorConstants.GreaterThanComparisonLabel;

    constructor() {}

    getClassName() {
        return 'GreaterThan';
    }
}

export class LessThan implements ComparisonOperator {
    type = ComparisonOperatorConstants.LessThanComparisonOperator;
    label = ComparisonOperatorConstants.LessThanComparisonLabel;

    constructor() {}

    getClassName() {
        return 'LessThan';
    }
}

export class LessThanEquals implements ComparisonOperator {
    type = ComparisonOperatorConstants.LessThanEqualsComparisonOperator;
    label = ComparisonOperatorConstants.LessThanQualsComparisonLabel;

    constructor() {}

    getClassName() {
        return 'LessThanEquals';
    }
}

export class Exists implements ComparisonOperator {
    type = ComparisonOperatorConstants.ExistsComparisonOperator;
    label = ComparisonOperatorConstants.ExistsComparisonLabel;

    constructor() {}

    getClassName() {
        return 'Exists';
    }
}

export class Like implements ComparisonOperator {
    type = ComparisonOperatorConstants.LikeComparisonOperator;
    label = ComparisonOperatorConstants.LikeComparisonLabel;

    constructor() {}

    getClassName() {
        return 'Like';
    }
}

export class Match implements ComparisonOperator {
    type = ComparisonOperatorConstants.MatchComparisonOperator;
    label = ComparisonOperatorConstants.MatchComparisonLabel;

    constructor() {}

    getClassName() {
        return 'Match';
    }
}

/**
 * combination of a comparison operator and a value literal or an IRI.
 * In case the comparison operator is 'Exists', no value is given.
 */
export class ComparisonOperatorAndValue {
    constructor(
        readonly comparisonOperator: ComparisonOperator,
        readonly value?: Value
    ) {}
}

/**
 * an abstract interface representing a value: an IRI or a literal.
 */
export interface Value {
    /**
     * turns the value into a SPARQL string representation.
     *
     */
    toSparql(): string;
}

/**
 * represents a property's value as a literal with the indication of its type.
 */
export class ValueLiteral implements Value {
    /**
     * constructs a [ValueLiteral].
     *
     * @param value the literal representation of the value.
     * @param type the type of the value (making use of xsd).
     */
    constructor(public readonly value: string, public readonly type: string) {}

    /**
     * creates a type annotated value literal to be used in a SPARQL query.
     *
     */
    public toSparql(): string {
        return `"${this.value}"^^<${this.type}>`;
    }
}

/**
 * represents an IRI.
 */
export class IRI implements Value {
    /**
     * constructs an [IRI].
     *
     * @param iri the IRI of a resource instance.
     */
    constructor(readonly iri: string) {}

    /**
     * creates a SPARQL representation of the IRI.
     *
     * @param schema indicates the Knora schema to be used.
     */
    public toSparql(): string {
        // this is an instance Iri and does not have to be converted.
        return `<${this.iri}>`;
    }
}

/**
 * represents a linked resource.
 */
export class LinkedResource implements Value {
    /**
     * constructs a [LinkedResource].
     *
     * @param properties the properties of the linked resource.
     * @param resourceClass the class of the linked resource, if any.
     */
    constructor(
        public properties: PropertyWithValue[],
        public resourceClass?: string
    ) {}

    public toSparql(): string {
        throw Error('invalid call of toSparql');
    }
}

/**
 * an abstract interface that represents a value.
 * This interface has to be implemented for all value types (value component classes).
 */
export interface PropertyValue {
    /**
     * type of the value.
     */
    type: string;

    /**
     * returns the value.
     *
     */
    getValue(): Value;
}

/**
 * represents a property, the specified comparison operator, and value.
 */
export class PropertyWithValue {
    /**
     * constructs a [PropertyWithValue].
     *
     * @param property the specified property.
     * @param valueLiteral the specified comparison operator and value.
     * @param isSortCriterion indicates if the property is used as a sort criterion.
     */
    constructor(
        readonly property: ResourcePropertyDefinition,
        readonly valueLiteral: ComparisonOperatorAndValue,
        readonly isSortCriterion: boolean
    ) {}
}

/**
 * a list, which is used in the mat-autocomplete form field
 * contains objects with id and name. the id is usual the iri
 */
export interface AutocompleteItem {
    iri: string;
    name: string;
    label?: string;
}
