import { ReadResource } from './read-resource';

/**
 * @category Model V2
 */
export class ReadResourceSequence {
  /**
   * Represents a sequence of resources.
   *
   * @param resources sequence of resources.
   * @param mayHaveMoreResults flag whether there are more results to be fetched, i.e. for search results.
   */
  constructor(
    readonly resources: ReadResource[],
    readonly mayHaveMoreResults = false
  ) {}
}
