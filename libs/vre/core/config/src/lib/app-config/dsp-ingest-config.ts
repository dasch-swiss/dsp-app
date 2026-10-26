/**
 * configuration to instantiate the ingest url.
 *
 * @category Config
 */
export class DspIngestConfig {
  /**
   * @param _ingestUrl the base url of the ingest routes, e.g. `https://api.dev.dasch.swiss/ingest`
   */
  constructor(private readonly _ingestUrl: string) {}

  /** The base url without trailing slashes, so `${url}/projects/...` never contains `//`. */
  get url(): string {
    return this._ingestUrl.replace(/\/+$/, '');
  }
}
