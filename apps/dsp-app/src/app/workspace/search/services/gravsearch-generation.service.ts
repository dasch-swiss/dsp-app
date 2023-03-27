/**
 *
 * create Gravsearch queries from provided parameters.
 */
import { Injectable } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import {
    AdvancedSearchParams,
    AdvancedSearchParamsService,
} from './advanced-search-params.service';
import {
    LinkedResource,
    PropertyWithValue,
} from '../advanced-search/resource-and-property-selection/search-select-property/specify-property-value/operator';
import { ComparisonOperatorConstants } from '../advanced-search/resource-and-property-selection/search-select-property/specify-property-value/operator-constants';

@Injectable({
    providedIn: 'root',
})
export class GravsearchGenerationService {
    complexTypeToProp = {
        [Constants.IntValue]: Constants.IntValueAsInt,
        [Constants.DecimalValue]: Constants.DecimalValueAsDecimal,
        [Constants.BooleanValue]: Constants.BooleanValueAsBoolean,
        [Constants.TextValue]: Constants.ValueAsString,
        [Constants.UriValue]: Constants.UriValueAsUri,
        [Constants.ListValue]: Constants.ListValueAsListNode,
    };

    // criteria for the order by statement
    private _orderByCriteria = [];

    // statements to be returned in query results
    private _returnStatements = [];

    constructor(private _searchParamsService: AdvancedSearchParamsService) {}

    /**
     *
     * will be replaced by `@knora/api` (github:knora-api-js-lib)
     *
     * Generates a Gravsearch query from the provided arguments.
     *
     * @param properties the properties specified by the user.
     * @param mainResourceClassOption the class of the main resource, if any.
     * @param offset the offset to be used (nth page of results).
     */
    createGravsearchQuery(
        properties: PropertyWithValue[],
        mainResourceClassOption?: string,
        offset: number = 0
    ): string {
        // reinit for each Gravsearch query since this service is a singleton
        this._orderByCriteria = [];
        this._returnStatements = [];

        // class restriction for the resource searched for
        let mainResourceClass = '';

        // if given, create the class restriction for the main resource
        if (mainResourceClassOption !== undefined) {
            mainResourceClass = `?mainRes a <${mainResourceClassOption}> .`;
        }

        // loop over given properties and create statements and filters from them
        const props: string[] = properties
            .map(this._makeHandlePropsMethod('mainRes'))
            .map(
                (statementAndRestriction) =>
                    `${statementAndRestriction[0]}
${statementAndRestriction[1]}
`
            );

        let orderByStatement = '';

        if (this._orderByCriteria.length > 0) {
            orderByStatement = `
ORDER BY ${this._orderByCriteria.join(' ')}
`;
        }

        // template of the Gravsearch query with dynamic components
        const gravsearchTemplate = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .

${this._returnStatements.join('\n')}

} WHERE {

?mainRes a knora-api:Resource .

${mainResourceClass}

${props.join('')}

}
${orderByStatement}`;

        // offset component of the Gravsearch query
        const offsetTemplate = `
OFFSET ${offset}
`;

        // function that generates the same Gravsearch query with the given offset
        const generateGravsearchQueryWithCustomOffset = (
            localOffset: number
        ): string => {
            const offsetCustomTemplate = `
OFFSET ${localOffset}
`;

            return gravsearchTemplate + offsetCustomTemplate;
        };

        if (offset === 0) {
            // store the function so another Gravsearch query can be created with an increased offset
            this._searchParamsService.changeSearchParamsMsg(
                new AdvancedSearchParams(
                    generateGravsearchQueryWithCustomOffset
                )
            );
        }

        return gravsearchTemplate + offsetTemplate;
    }

    /**
     * factory method returning a property handling method.
     *
     * @param resourceVar Name of the variable identifying the resource.
     * @param topLevel Flag indicating if the top level is affected (main resource).
     * @param callCounter Inidcates the number of recursive calls of this method.
     */
    private _makeHandlePropsMethod(
        resourceVar: string,
        topLevel = true,
        callCounter = 0
    ): (propWithVal: PropertyWithValue, index: number) => [string, string] {
        /**
         * converts a [PropertyWithValue] into a tuple of statements and restrictions.
         *
         * @param propWithVal property with value to be converted.
         * @param index index identifying the current prop.
         */
        const handleProps = (
            propWithVal: PropertyWithValue,
            index: number
        ): [string, string] => {
            let linkedResStatementsAndRestrictions: [string, string][] = [];
            // represents the object of a statement
            let object;
            // it is not a linking property, or it is a linking property BUT the comparator is either 'exists' or 'not exists'
            if (
                !propWithVal.property.isLinkProperty ||
                propWithVal.valueLiteral.comparisonOperator.getClassName() ===
                    'Exists' ||
                propWithVal.valueLiteral.comparisonOperator.getClassName() ===
                    'NotExists'
            ) {
                // it is not a linking property, create a variable for the value (to be used by a subsequent FILTER)
                // oR the comparison operator Exists is used in which case we do not need to specify the object any further
                if (topLevel) {
                    object = `?propVal${index}`;
                } else {
                    object = `?propVal${resourceVar}${index}`;
                }
            } else {
                // it is a linking property and the comparison operator is not Exists,
                if (
                    !(propWithVal.valueLiteral.value instanceof LinkedResource)
                ) {
                    // use its IRI
                    object = propWithVal.valueLiteral.value.toSparql();
                } else {
                    // specify the resource's properties
                    const linkedResVarName = `linkedRes${callCounter}${index}`;

                    object = `?${linkedResVarName}`;
                    // recursively call this method to handle the linked resource's properties
                    linkedResStatementsAndRestrictions =
                        propWithVal.valueLiteral.value.properties.map(
                            this._makeHandlePropsMethod(
                                linkedResVarName,
                                false,
                                callCounter + 1
                            )
                        );
                }
            }

            // generate statement
            let statement = `?${resourceVar} <${propWithVal.property.id}> ${object} .`;

            if (linkedResStatementsAndRestrictions.length > 0) {
                // get statements from two-tuple
                statement += linkedResStatementsAndRestrictions
                    .map((statAndRestr) => statAndRestr[0])
                    .reduce((acc: string, stat: string) => acc + stat);
            }

            // check if it is a linking property that has to be wrapped in a FILTER NOT EXISTS (comparison operator NOT_EQUALS) to negate it
            if (
                propWithVal.property.isLinkProperty &&
                propWithVal.valueLiteral.comparisonOperator.getClassName() ===
                    'NotEquals'
            ) {
                // do not include statement in results, because the query checks for the absence of this statement
                statement = `FILTER NOT EXISTS {
${statement}


}`;
            } else {
                // tODO: check if statement should be returned returned in results (Boolean flag from checkbox)
                if (topLevel) {
                    this._returnStatements.push(statement);
                }

                // add filter not exists if comparison operator is 'not exists'
                if (propWithVal.valueLiteral.comparisonOperator.getClassName() ===
                    'NotExists') {
                    statement = `FILTER NOT EXISTS {
${statement}


}`;
                } else {
                    statement = `
${statement}


`;
                }
            }

            // generate restricting expression (e.g., a FILTER) if comparison operator is not Exists
            let restriction = '';
            // only create a FILTER if the comparison operator is not EXISTS and it is not a linking property
            if (
                !propWithVal.property.isLinkProperty &&
                propWithVal.valueLiteral.comparisonOperator.getClassName() !==
                    'Exists' &&
                propWithVal.valueLiteral.comparisonOperator.getClassName() !==
                    'NotExists'
            ) {
                // generate variable for value literal
                const propValueLiteral = `${object}Literal`;

                if (
                    propWithVal.valueLiteral.comparisonOperator.getClassName() ===
                    'Like'
                ) {
                    // generate statement to value literal
                    restriction =
                        `${object} <${
                            this.complexTypeToProp[
                                propWithVal.property.objectType
                            ]
                        }> ${propValueLiteral}` + '\n';
                    // use regex function for LIKE
                    restriction += `FILTER regex(${propValueLiteral}, ${propWithVal.valueLiteral.value.toSparql()}, "i")`;
                } else if (
                    propWithVal.valueLiteral.comparisonOperator.getClassName() ===
                    'Match'
                ) {
                    // use Gravsearch function for MATCH
                    restriction += `FILTER <${
                        ComparisonOperatorConstants.MatchFunction
                    }>(${object}, ${propWithVal.valueLiteral.value.toSparql()})`;
                } else if (
                    propWithVal.property.objectType === Constants.DateValue
                ) {
                    // handle date property
                    // cleanse date value
                    const dateValue = propWithVal.valueLiteral.value
                        .toSparql()
                        .replace(/-undefined/g, '');
                    restriction = `FILTER(knora-api:toSimpleDate(${object}) ${propWithVal.valueLiteral.comparisonOperator.type} ${dateValue})`;
                } else if (
                    propWithVal.property.objectType === Constants.ListValue
                ) {
                    // handle list node
                    restriction =
                        `${object} <${
                            this.complexTypeToProp[
                                propWithVal.property.objectType
                            ]
                        }> ${propWithVal.valueLiteral.value.toSparql()}` +
                        ' .\n';
                    // check for comparison operator "not equals"
                    if (
                        propWithVal.valueLiteral.comparisonOperator.getClassName() ===
                        'NotEquals'
                    ) {
                        restriction = `FILTER NOT EXISTS {
${restriction}
}`;
                    }
                } else {
                    // generate statement to value literal
                    restriction =
                        `${object} <${
                            this.complexTypeToProp[
                                propWithVal.property.objectType
                            ]
                        }> ${propValueLiteral}` + '\n';
                    // generate filter expression
                    restriction += `FILTER(${propValueLiteral} ${
                        propWithVal.valueLiteral.comparisonOperator.type
                    } ${propWithVal.valueLiteral.value.toSparql()})`;
                }
            }

            // check for class restriction on linked resource, if any
            if (
                propWithVal.valueLiteral.value instanceof LinkedResource &&
                propWithVal.valueLiteral.value.resourceClass !== undefined
            ) {
                restriction += `\n${object} a <${propWithVal.valueLiteral.value.resourceClass}> .\n`;
            }

            if (linkedResStatementsAndRestrictions.length > 0) {
                // get restriction from two-tuple
                restriction += linkedResStatementsAndRestrictions
                    .map((statAndRestr) => statAndRestr[1])
                    .reduce((acc: string, restr: string) => acc + '\n' + restr);
            }

            // check if current value is a sort criterion
            if (propWithVal.isSortCriterion) {
                this._orderByCriteria.push(object);
            }

            return [statement, restriction];
        };

        return handleProps;
    }
}
