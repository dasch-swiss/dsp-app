import { inject, Injectable } from '@angular/core';
import { MAIN_RESOURCE_PLACEHOLDER, RDFS_TYPE, RESOURCE_PLACEHOLDER } from '../constants';
import { escapeForGravsearchStringLiteral, StatementElement } from '../model';
import { GravsearchWriter } from './gravsearch-writer';
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

  generateGravSearchQuery(statements: StatementElement[], fulltextTerm?: string): string {
    const writer = new GravsearchWriter(statements);
    const scoped = statements.map((_, i) => writer.at(i));
    const constructStatements = scoped.map(s => s.constructStatement).join('\n');
    const whereClause = scoped.map(s => s.whereStatement).join('\n');
    const trimmedTerm = fulltextTerm?.trim() ?? '';
    const fulltextTriple = trimmedTerm
      ? `?mainRes ?valueProperty ?searchThis .\n  FILTER knora-api:matchText(?searchThis, "${escapeForGravsearchStringLiteral(trimmedTerm)}") .\n`
      : '';
    const ontoShortCode = this.ontoShortCode;

    return (
      'PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\n' +
      `PREFIX ${ontoShortCode}: <${this.ontoIri}#>\n` +
      'CONSTRUCT {\n' +
      '?mainRes knora-api:isMainResource true .\n' +
      `${constructStatements}\n` +
      '} WHERE {\n' +
      '?mainRes a knora-api:Resource .\n' +
      `${this._restrictToResourceClassStatement()}\n` +
      `${fulltextTriple}` +
      `${whereClause}\n` +
      '}\n' +
      `${this._getOrderByString(statements)}\n` +
      'OFFSET 0'
    );
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
        const index = statements.findIndex(stm => stm.selectedPredicate?.iri === o.id);
        return `${RESOURCE_PLACEHOLDER}${index}`;
      });

    return orderByProps.length ? `ORDER BY ${orderByProps.join(' ')}` : '';
  }
}
