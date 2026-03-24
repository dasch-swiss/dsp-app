/**
 * Params for fulltext search.
 * @category Model V2
 */
export interface IFulltextSearchParams {
  /**
   * Iri of resource class the fulltext search is restricted to, if any.
   */
  limitToResourceClass?: string;

  /**
   * Iri of the project the fulltext search is restricted to, if any.
   */
  limitToProject?: string;

  /**
   * Iri of standoff class the fulltext search is restricted to, if any.
   */
  limitToStandoffClass?: string;
}
