/**
 * configuration to instantiate the ingest url.
 *
 * @category Config
 */
export class DspIngestConfig {
  /**
   * @param _ingestUrl the url to the ingest service
   */
  constructor(private _ingestUrl: string) {}

  get url(): string {
    return this._ingestUrl;
  }
}
