/**
 * Params for search by label
 *
 * @category Model V2
 */
export interface ILabelSearchParams {
  /**
   * Iri of the project the search by label is restricted to, if any.
   */
  limitToResourceClass?: string;

  /**
   * Iri of the project the search by label is restricted to, if any.
   */
  limitToProject?: string;
}
