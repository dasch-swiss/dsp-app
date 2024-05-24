/**
 * configuration to instantiate the ingest url.
 *
 * @category Config
 */
export class DspIngestConfig {
  /**
   * @param ingestUrl the url to the ingest service
   */
  constructor(public ingestUrl: string) {}

  get url(): string {
    return this.ingestUrl;
  }
}
