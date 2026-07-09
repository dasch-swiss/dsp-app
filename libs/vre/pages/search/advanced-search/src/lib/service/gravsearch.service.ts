import { inject, Injectable } from '@angular/core';
import { RESOURCE_PLACEHOLDER } from '../constants';
import { escapeSparqlStringLiteral, OrderByItem, StatementElement } from '../model';
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
   * Pure w.r.t. the search form state: `statements`, `fulltext`, `resourceClassIri`, and `orderBy`
   * are all passed explicitly, so the query is a pure function of its inputs. Ontology IRI/short-code
   * still come from `OntologyDataService` — the ontology is itself URL-driven, not form state.
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
    // Fulltext term → single top-level FILTER on the main resource (matchFulltext). This matches the
    // resource by its label, text values, value comments, or list entries — semantics owned by the
    // backend function. NB: escapeSparqlStringLiteral emits a plain double-quoted SPARQL literal (the
    // shape matchFulltext expects, interpreted as a Lucene query); do NOT use the regex over-escaper.
    const fulltextTriple = trimmedTerm
      ? `  FILTER knora-api:matchFulltext(?mainRes, "${escapeSparqlStringLiteral(trimmedTerm)}") .\n`
      : '';
    // The ontology short-code PREFIX is unused by the generated query (statements emit full <IRI>s) —
    // it only names the selected data model. Omit it (and skip `ontoShortCode`, which throws on an empty
    // IRI) when no data model is selected, so a project-wide fulltext-only search still generates.
    const ontoPrefix = this.ontoIri ? `PREFIX ${this.ontoShortCode}: <${this.ontoIri}#>\n` : '';

    return (
      'PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\n' +
      'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' +
      ontoPrefix +
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

  private _restrictToResourceClassStatement(resourceClassIri: string): string {
    // A selected class → a plain type restriction. No class → leave classes open: the always-present
    // `?mainRes a knora-api:Resource .` keeps the result set unrestricted by class, and project scope
    // (limitToProject, passed by the results component) constrains it. No per-class UNION.
    return resourceClassIri ? `?mainRes a <${resourceClassIri}> .` : '';
  }

  private _getOrderByString(statements: StatementElement[], orderBy: OrderByItem[]): string {
    const orderByProps: string[] = orderBy
      .filter(o => o.orderBy)
      .map(o => {
        const index = statements.findIndex(stm => stm.selectedPredicate?.iri === o.id);
        const variable = `${RESOURCE_PLACEHOLDER}${index}`;
        const fn = o.direction === 'desc' ? 'DESC' : 'ASC';
        return `${fn}(${variable})`;
      });

    return orderByProps.length ? `ORDER BY ${orderByProps.join(' ')}` : 'ORDER BY ASC(?label)';
  }
}
