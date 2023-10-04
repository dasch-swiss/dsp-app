import { Injectable } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import {
    GravsearchPropertyString,
    ResourceLabel,
} from '../advanced-search-service/advanced-search.service';
import {
    PropertyFormItem,
    OrderByItem,
    Operators,
} from '../advanced-search-store/advanced-search-store.service';
@Injectable({
    providedIn: 'root',
})
export class GravsearchService {
    generateGravSearchQuery(
        resourceClassIri: string | undefined,
        properties: PropertyFormItem[],
        orderByList: OrderByItem[]
    ): string {
        // class restriction for the resource searched for
        let restrictToResourceClass = '';

        // if given, create the class restriction for the main resource
        if (resourceClassIri !== undefined) {
            restrictToResourceClass = `?mainRes a <${resourceClassIri}> .`;
        }

        const propertyStrings: GravsearchPropertyString[] = properties.map(
            (prop, index) => this._propertyStringHelper(prop, index)
        );

        let orderByString = '';
        const orderByProps: string[] = [];

        // use the id in the orderByList to loop through properties to find the index of the property in the properties list
        // then add the string with the index to orderByProps
        orderByList
            .filter((orderByItem) => orderByItem.orderBy === true)
            .forEach((orderByItem) => {
                const index = properties.findIndex(
                    (prop) => prop.id === orderByItem.id
                );
                if (index > -1) {
                    if (
                        properties[index].selectedProperty?.objectType ===
                        ResourceLabel
                    ) {
                        // add first 8 characters of the property id to create unique identifier for the variable name when searching for a resource label
                        // it's sliced because gravsearch doesn't allow minus signs in variable names
                        orderByProps.push(
                            `?label${properties[index].id.slice(0, 8)}`
                        );
                    } else {
                        orderByProps.push(`?prop${index}`);
                    }
                }
            });

        orderByString = orderByProps.length
            ? `ORDER BY ${orderByProps.join(' ')}`
            : '';

        const gravSearch =
            `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\n` +
            `CONSTRUCT {\n` +
            `?mainRes knora-api:isMainResource true .\n` +
            `${propertyStrings
                .map((prop) => prop.constructString)
                .join('\n')}\n` +
            `} WHERE {\n` +
            `?mainRes a knora-api:Resource .\n` +
            `${restrictToResourceClass}\n` +
            `${propertyStrings.map((prop) => prop.whereString).join('\n')}\n` +
            `}\n` +
            `${orderByString}\n` +
            `OFFSET 0`;
        console.log('gravSearch: ', gravSearch);

        return gravSearch;
    }

    private _propertyStringHelper(
        property: PropertyFormItem,
        index: number
    ): GravsearchPropertyString {
        let constructString = '';
        let whereString = '';

        // not a linked resource, not a resource label
        if (
            property.selectedProperty?.objectType.includes(
                Constants.KnoraApiV2
            ) &&
            property.selectedProperty?.objectType !== ResourceLabel
        ) {
            constructString =
                '?mainRes <' +
                property.selectedProperty?.iri +
                '> ?prop' +
                index +
                ' .';
            whereString = constructString;
        }

        // linked resource
        if (
            !property.selectedProperty?.objectType.includes(
                Constants.KnoraApiV2
            ) &&
            property.selectedProperty?.objectType !== ResourceLabel
        ) {
            if (property.selectedOperator !== Operators.NotEquals) {
                constructString =
                    '?mainRes <' +
                    property.selectedProperty?.iri +
                    '> ?prop' +
                    index +
                    ' .';
                whereString = constructString;
            }
            if (Array.isArray(property.searchValue)) {
                property.searchValue.forEach((value, i) => {
                    if (value.selectedProperty?.objectType !== ResourceLabel) {
                        constructString += `\n?prop${index} <${value.selectedProperty?.iri}> ?linkProp${index}${i} .`;
                        if (value.selectedOperator === Operators.NotExists) {
                            whereString +=
                                `\nFILTER NOT EXISTS { \n` +
                                `?prop${index} <${value.selectedProperty?.iri}> ?linkProp${index}${i} .\n` +
                                `}\n`;
                        } else {
                            whereString += `\n?prop${index} <${value.selectedProperty?.iri}> ?linkProp${index}${i} .`;
                        }
                    }
                });
            }
        }

        if (
            !(
                property.selectedOperator === Operators.Exists ||
                property.selectedOperator === Operators.NotExists
            )
        ) {
            whereString += this._valueStringHelper(
                property,
                index,
                '?prop',
                '?mainRes'
            );
        } else if (property.selectedOperator === Operators.NotExists) {
            whereString = `FILTER NOT EXISTS { \n` + whereString + `}\n`;
        }

        return {
            constructString: constructString,
            whereString: whereString,
        };
    }

    /**
     *
     * @param property the PropertyFormItem to create the value string for
     * @param index index of the property in the properties list
     * @param identifier indentifier for the property, either ?prop or ?linkProp + index
     * @param labelRes variable name for which resource the label is searched on, either ?mainRes or ?prop + index
     * @returns a gravsearch value string
     */
    private _valueStringHelper(
        property: PropertyFormItem,
        index: number,
        identifier: string,
        labelRes: string
    ): string {
        // add first 8 characters of the property id to create unique identifier for the variable name when searching for a resource label
        // it's sliced because gravsearch doesn't allow minus signs in variable names
        const labelVariableName = `?label${property.id.slice(0, 8)}`;

        // linked resource
        if (
            !property.selectedProperty?.objectType.includes(
                Constants.KnoraApiV2
            )
        ) {
            let valueString = '';
            switch (property.selectedOperator) {
                case Operators.Equals:
                    return `?mainRes <${property.selectedProperty?.iri}> <${property.searchValue}> .`;
                case Operators.NotEquals:
                    // this looks wrong but it is correct
                    return (
                        `FILTER NOT EXISTS { \n` +
                        `?mainRes <${property.selectedProperty?.iri}> <${property.searchValue}> . }`
                    );
                case Operators.Matches:
                    if (Array.isArray(property.searchValue)) {
                        property.searchValue.forEach((value, i) => {
                            if (
                                value.selectedOperator !== Operators.Exists &&
                                value.selectedOperator !== Operators.NotExists
                            ) {
                                valueString += this._valueStringHelper(
                                    value,
                                    i,
                                    '?linkProp' + index,
                                    '?prop' + index
                                );
                            }
                        });
                    }
                    return valueString;
                default:
                    throw new Error('Invalid operator for linked resource');
            }
        } else {
            switch (property.selectedProperty?.objectType) {
                case ResourceLabel:
                    switch (property.selectedOperator) {
                        case Operators.Equals:
                        case Operators.NotEquals:
                            return (
                                `${labelRes} rdfs:label ${labelVariableName} .\n` +
                                `FILTER (${labelVariableName} ${this._operatorToSymbol(
                                    property.selectedOperator
                                )} "${property.searchValue}") .`
                            );
                        case Operators.IsLike:
                            return (
                                `${labelRes} rdfs:label ${labelVariableName} .\n` +
                                `FILTER regex(${labelVariableName}, "${property.searchValue}", "i") .`
                            );
                        case Operators.Matches:
                            return (
                                `${labelRes} rdfs:label ${labelVariableName} .\n` +
                                `FILTER knora-api:matchLabel(${labelRes}, "${property.searchValue}") .`
                            );
                        default:
                            throw new Error(
                                'Invalid operator for resource label'
                            );
                    }
                case Constants.TextValue:
                    switch (property.selectedOperator) {
                        case Operators.Equals:
                        case Operators.NotEquals:
                            return (
                                `${identifier}${index} <${Constants.ValueAsString}> ${identifier}${index}Literal .\n` +
                                `FILTER (${identifier}${index}Literal ${this._operatorToSymbol(
                                    property.selectedOperator
                                )} "${property.searchValue}"^^<${
                                    Constants.XsdString
                                }>) .`
                            );
                        case Operators.IsLike:
                            return (
                                `${identifier}${index} <${Constants.ValueAsString}> ${identifier}${index}Literal .\n` +
                                `FILTER ${this._operatorToSymbol(
                                    property.selectedOperator
                                )}(${identifier}${index}Literal, "${
                                    property.searchValue
                                }"^^<${Constants.XsdString}>, "i") .`
                            );
                        case Operators.Matches:
                            return `FILTER <${this._operatorToSymbol(
                                property.selectedOperator
                            )}>(${identifier}${index}, "${
                                property.searchValue
                            }"^^<${Constants.XsdString}>) .`;
                        default:
                            throw new Error('Invalid operator for text value');
                    }
                case Constants.IntValue:
                    return (
                        `${identifier}${index} <${Constants.IntValueAsInt}> ${identifier}${index}Literal .\n` +
                        `FILTER (${identifier}${index}Literal ${this._operatorToSymbol(
                            property.selectedOperator
                        )} "${property.searchValue}"^^<${
                            Constants.XsdInteger
                        }>) .`
                    );
                case Constants.DecimalValue:
                    return (
                        `${identifier}${index} <${Constants.DecimalValueAsDecimal}> ${identifier}${index}Literal .\n` +
                        `FILTER (${identifier}${index}Literal ${this._operatorToSymbol(
                            property.selectedOperator
                        )} "${property.searchValue}"^^<${
                            Constants.XsdDecimal
                        }>) .`
                    );
                case Constants.BooleanValue:
                    return (
                        `${identifier}${index} <${Constants.BooleanValueAsBoolean}> ${identifier}${index}Literal .\n` +
                        `FILTER (${identifier}${index}Literal ${this._operatorToSymbol(
                            property.selectedOperator
                        )} "${property.searchValue}"^^<${
                            Constants.XsdBoolean
                        }>) .`
                    );
                case Constants.DateValue:
                    return `FILTER(knora-api:toSimpleDate(${identifier}${index}) ${this._operatorToSymbol(
                        property.selectedOperator
                    )} "${property.searchValue}"^^<${
                        Constants.KnoraApi
                    }/ontology/knora-api/simple/v2${
                        Constants.HashDelimiter
                    }Date>) .`;
                case Constants.ListValue:
                    return `${identifier}${index} <${Constants.ListValueAsListNode}> <${property.searchValue}> .\n`;
                case Constants.UriValue:
                    return (
                        `${identifier}${index} <${Constants.UriValueAsUri}> ${identifier}${index}Literal .\n` +
                        `FILTER (${identifier}${index}Literal ${this._operatorToSymbol(
                            property.selectedOperator
                        )} "${property.searchValue}"^^<${
                            Constants.XsdAnyUri
                        }>) .`
                    );
                default:
                    throw new Error('Invalid object type');
            }
        }
    }

    private _operatorToSymbol(operator: string | undefined): string {
        switch (operator) {
            case Operators.Equals:
                return '=';
            case Operators.NotEquals:
                return '!=';
            case Operators.GreaterThan:
                return '>';
            case Operators.GreaterThanEquals:
                return '>=';
            case Operators.LessThan:
                return '<';
            case Operators.LessThanEquals:
                return '<=';
            case Operators.Exists:
                return 'E';
            case Operators.NotExists:
                return '!E';
            case Operators.IsLike:
                return 'regex';
            case Operators.Matches:
                return Constants.MatchText;
            default:
                return '';
        }
    }
}
