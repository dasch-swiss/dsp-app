import { inject, Injectable } from '@angular/core';
import { MAIN_RESOURCE_PLACEHOLDER, RDFS_TYPE, RESOURCE_PLACEHOLDER } from '../constants';
import { escapeForGravsearchStringLiteral, OrderByItem, StatementElement } from '../model';
import { GravsearchWriter } from './gravsearch-writer';
import { OntologyDataService } from './ontology-data.service';

@Injectable()
export class GravsearchService {
  private dataService: OntologyDataService = inject(OntologyDataService);

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

  /**
   * Pure w.r.t. the search form state: `resourceClassIri` and `orderBy` are passed explicitly
   * rather than read from `SearchStateService` (DEV-6576 D1). Ontology IRI/short-code still come
   * from `OntologyDataService` — the ontology is itself URL-driven, not committed form state.
   * The generated query string is byte-identical to the previous ambient-read implementation for
   * the same (statements, fulltext, resourceClassIri, orderBy) inputs.
   */
  generateGravSearchQuery(
    statements: StatementElement[],
    fulltextTerm?: string,
    resourceClassIri = '',
    orderBy: OrderByItem[] = []
  ): string {
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
      'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' +
      `PREFIX ${ontoShortCode}: <${this.ontoIri}#>\n` +
      'CONSTRUCT {\n' +
      '?mainRes knora-api:isMainResource true .\n' +
      `${constructStatements}\n` +
      '} WHERE {\n' +
      '?mainRes a knora-api:Resource .\n' +
      `${this._restrictToResourceClassStatement(resourceClassIri)}\n` +
      '?mainRes rdfs:label ?label .\n' +
      `${fulltextTriple}` +
      `${whereClause}\n` +
      '}\n' +
      `${this._getOrderByString(statements, orderBy)}\n` +
      'OFFSET 0'
    );
  }

  private _restrictToResourceClassStatement(resourceClassIri: string) {
    return resourceClassIri
      ? `?mainRes a <${resourceClassIri}> .`
      : this.dataService.classIris
          .map(
            resourceClass =>
              `{ ${MAIN_RESOURCE_PLACEHOLDER} ${RDFS_TYPE} ${this.ontoShortCode}:${resourceClass.split('#').pop()} . }`
          )
          .join(' UNION ');
  }

  private _getOrderByString(statements: StatementElement[], orderBy: OrderByItem[]): string {
    const orderByProps: string[] = orderBy
      .filter(o => o.orderBy)
      .map(o => {
        const index = statements.findIndex(stm => stm.selectedPredicate?.iri === o.id);
        return `${RESOURCE_PLACEHOLDER}${index}`;
      });

    return orderByProps.length ? `ORDER BY ${orderByProps.join(' ')}` : 'ORDER BY ASC(?label)';
  }
}
