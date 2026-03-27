import { inject, Injectable } from '@angular/core';
import { Constants } from '@dasch-swiss/dsp-js';
import { MAIN_RESOURCE_PLACEHOLDER, RDFS_TYPE, RESOURCE_PLACEHOLDER, ResourceLabel } from '../constants';
import { GravsearchWriter, StatementElement } from '../model';
import { Operator } from '../operators.config';
import { OntologyDataService } from './ontology-data.service';
import { SearchStateService } from './search-state.service';

@Injectable()
export class GravsearchService {
  private dataService: OntologyDataService = inject(OntologyDataService);
  private _searchStateService = inject(SearchStateService);

  get ontoIri(): string {
    return this.dataService.selectedOntology.iri;
  }

  get ontoShortCode(): string {
    const ontoShortCodeMatch = this.ontoIri.match(/\/([^/]+)\/v2$/);
    if (!ontoShortCodeMatch) {
      throw new Error(`Invalid ontology IRI format: ${this.ontoIri}`);
    }
    return ontoShortCodeMatch[1];
  }

  generateGravSearchQuery(statements: StatementElement[]): string {
    const constructStatements = this._buildConstructStatements(statements);
    const whereClause = this._buildWhereClause(statements);

    const gravSearch =
      'PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\n' +
      `PREFIX ${this.ontoShortCode}: <${this.ontoIri}#>\n` +
      'CONSTRUCT {\n' +
      '?mainRes knora-api:isMainResource true .\n' +
      `${constructStatements}\n` +
      '} WHERE {\n' +
      '?mainRes a knora-api:Resource .\n' +
      `${this._restrictToResourceClassStatement()}\n` +
      `${whereClause}\n` +
      '}\n' +
      `${this._getOrderByString(statements)}\n` +
      'OFFSET 0';

    return gravSearch;
  }

  private _buildConstructStatements(statements: StatementElement[]): string {
    const writer = new GravsearchWriter(statements);
    return statements.map((_, i) => writer.at(i).constructStatement).join('\n');
  }

  private _buildWhereClause(statements: StatementElement[]): string {
    const writer = new GravsearchWriter(statements);
    return statements.map((_, i) => writer.at(i).whereStatement).join('\n');
  }

  private _restrictToResourceClassStatement() {
    return this._searchStateService.currentState.selectedResourceClass?.iri
      ? `?mainRes a <${this._searchStateService.currentState.selectedResourceClass?.iri}> .`
      : this.dataService.classIris
          .map(
            resourceClass =>
              `{ ${MAIN_RESOURCE_PLACEHOLDER} ${RDFS_TYPE} ${this.ontoShortCode}:${resourceClass.split('#').pop()} . }`
          )
          .join(' UNION ');
  }

  private _getOrderByString(statements: StatementElement[]): string {
    const orderByProps: string[] = this._searchStateService.currentState.orderBy
      .filter(o => o.orderBy)
      .map(o => {
        const index = statements.findIndex(stm => stm.id === o.id);
        return `${RESOURCE_PLACEHOLDER}${index}`;
      });

    return orderByProps.length ? `ORDER BY ${orderByProps.join(' ')}` : '';
  }
}
