import { Inject, Injectable } from '@angular/core';
import { CountQueryResponse, KnoraApiConnection, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IncomingService {
  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {}

  // ------------------------------------------------------------------------
  // ------------------------------------------------------------------------
  // (incoming) file representations e.g. incomingStillImages in case of book
  // ------------------------------------------------------------------------

  /**
   *
   * returns all the StillImageRepresentations for the given resource, if any.
   * StillImageRepresentations link to the given resource via knora-base:isPartOf.
   *
   * @param {string} resourceIri the Iri of the resource whose StillImageRepresentations should be returned.
   * @param {number} offset the offset to be used for paging. 0 is the default and is used to get the first page of results.
   * @param {boolean} countQuery if set to true, the request returns only the CountQueryResponse; default value is `false`
   */
  getStillImageRepresentationsForCompoundResource(
    resourceIri: string,
    offset: number,
    countQuery = false
  ): Observable<CountQueryResponse | ReadResourceSequence> {
    const sparqlQueryStr = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/simple/v2#>

CONSTRUCT {
?page knora-api:isMainResource true .

?page knora-api:seqnum ?seqnum .

?page knora-api:hasStillImageFile ?file .
} WHERE {

?page a knora-api:StillImageRepresentation .
?page a knora-api:Resource .

?page knora-api:isPartOf <${resourceIri}> .
knora-api:isPartOf knora-api:objectType knora-api:Resource .

<${resourceIri}> a knora-api:Resource .

?page knora-api:seqnum ?seqnum .
knora-api:seqnum knora-api:objectType xsd:integer .

?seqnum a xsd:integer .

?page knora-api:hasStillImageFile ?file .
knora-api:hasStillImageFile knora-api:objectType knora-api:File .

?file a knora-api:File .

} ORDER BY ?seqnum
OFFSET ${offset}
`;

    return countQuery
      ? this._dspApiConnection.v2.search.doExtendedSearchCountQuery(sparqlQueryStr)
      : this._dspApiConnection.v2.search.doExtendedSearch(sparqlQueryStr);
  }
}
