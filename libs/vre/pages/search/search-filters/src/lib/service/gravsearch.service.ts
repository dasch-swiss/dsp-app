import { inject, Injectable } from '@angular/core';
import {
  LABEL_VARIABLE,
  MAIN_RESOURCE_PLACEHOLDER,
  RDFS_LABEL,
  RESOURCE_PLACEHOLDER,
  SORT_PLACEHOLDER,
} from '../constants';
import { escapeSparqlStringLiteral, OrderByItem, sanitizeSparqlIri, StatementElement } from '../model';
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
    const sortBindings = this._sortBindings(statements, orderBy);

    return (
      'PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\n' +
      'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' +
      ontoPrefix +
      'CONSTRUCT {\n' +
      '?mainRes knora-api:isMainResource true .\n' +
      `${constructStatements}\n` +
      '} WHERE {\n' +
      // `?mainRes` must be typed by *something* in the WHERE clause — dsp-api's Gravsearch type
      // inspection (SearchResponderV2 → GravsearchTypeInspectionRunner over the WHERE clause) fails a
      // query outright ("Types could not be determined for one or more entities: ?mainRes") when it
      // cannot infer a type for it. A selected class (`?mainRes a <class>`) or a matchFulltext term (its
      // first arg is resource-typed) both type it — and in the fulltext case the generic anchor is a
      // measured perf pessimization (it defeats matchFulltext's index anchoring), so we omit it there.
      // But `rdfs:label` does NOT type `?mainRes`, so a class-less label-only search (e.g. "Resource
      // label is like X" with no class and no fulltext) has nothing to anchor it → 400 (DEV-6889).
      // Restore the generic `?mainRes a knora-api:Resource .` anchor for exactly that gap: no class AND
      // no fulltext. (No per-class UNION — the removed optimization stays removed.)
      `${this._restrictToResourceClassStatement(resourceClassIri, trimmedTerm)}\n` +
      `?mainRes rdfs:label ${LABEL_VARIABLE} .\n` +
      `${fulltextTriple}` +
      `${whereClause}\n` +
      `${sortBindings.whereStatements}` +
      '}\n' +
      `${this._getOrderByString(statements, orderBy, sortBindings.variableByIri)}\n` +
      'OFFSET 0'
    );
  }

  private _restrictToResourceClassStatement(resourceClassIri: string, fulltextTerm: string): string {
    // Selected class → a plain type restriction (also the type anchor for `?mainRes`).
    if (resourceClassIri) {
      return `?mainRes a <${resourceClassIri}> .`;
    }
    // No class, but a fulltext term → matchFulltext types `?mainRes`; adding the generic anchor here
    // would only pessimize the backend (see WHERE-clause note), so emit nothing.
    if (fulltextTerm) {
      return '';
    }
    // No class and no fulltext → nothing else types `?mainRes`; emit the generic anchor so the query is
    // valid (project scope via limitToProject still constrains the result set).
    return '?mainRes a knora-api:Resource .';
  }

  /**
   * Variables for sort predicates no statement binds, plus the triples that bind them.
   *
   * The binding is `OPTIONAL` so a property sort reorders the class instead of filtering it: resources without a
   * value stay in the results and the count is unchanged.
   */
  private _sortBindings(statements: StatementElement[], orderBy: OrderByItem[]) {
    const variableByIri = new Map<string, string>();
    const triples: string[] = [];

    orderBy
      .filter(o => o.orderBy && o.id !== RDFS_LABEL)
      .filter(o => !statements.some(stm => stm.selectedPredicate?.iri === o.id))
      .forEach(o => {
        if (variableByIri.has(o.id)) {
          return;
        }
        const variable = `${SORT_PLACEHOLDER}${variableByIri.size}`;
        variableByIri.set(o.id, variable);
        // Same value-object projection `_getOrderByString` sorts on for filtered properties.
        triples.push(`OPTIONAL { ${MAIN_RESOURCE_PLACEHOLDER} <${sanitizeSparqlIri(o.id)}> ${variable} . }`);
      });

    return { variableByIri, whereStatements: triples.length ? `${triples.join('\n')}\n` : '' };
  }

  private _getOrderByString(
    statements: StatementElement[],
    orderBy: OrderByItem[],
    variableByIri: Map<string, string>
  ): string {
    const orderByProps: string[] = orderBy
      .filter(o => o.orderBy)
      .map(o => {
        // A ResourceLabel statement filters on the assembly's shared `?label` variable and no longer
        // binds a `?resN` object variable, so sort on `?label` for it; other statements sort on the
        // `?resN` bound by their object projection, by statement position. A property sorted by but not filtered on
        // uses the variable bound for it above.
        const statementIndex = statements.findIndex(stm => stm.selectedPredicate?.iri === o.id);
        const variable =
          o.id === RDFS_LABEL
            ? LABEL_VARIABLE
            : statementIndex >= 0
              ? `${RESOURCE_PLACEHOLDER}${statementIndex}`
              : (variableByIri.get(o.id) ?? LABEL_VARIABLE);
        const fn = o.direction === 'desc' ? 'DESC' : 'ASC';
        return `${fn}(${variable})`;
      });

    return orderByProps.length ? `ORDER BY ${orderByProps.join(' ')}` : `ORDER BY ASC(${LABEL_VARIABLE})`;
  }
}
