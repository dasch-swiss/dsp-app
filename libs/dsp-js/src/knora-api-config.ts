/**
 * Configuration to instantiate a `KnoraApiConnection`.
 *
 * @category Config
 */
export class KnoraApiConfig {
  static readonly PROTOCOL_HTTP = 'http';
  static readonly PROTOCOL_HTTPS = 'https';

  static readonly DEFAULT_PORT_HTTP = 80;
  static readonly DEFAULT_PORT_HTTPS = 443;

  /**
   * The full API URL
   */
  get apiUrl(): string {
    return this.apiProtocol + '://' + this.apiHost + (this.apiPort !== null ? ':' + this.apiPort : '') + this.apiPath;
  }

  /**
   * @param apiProtocol the protocol of the API (http or https)
   * @param apiHost the DSP-API base URL
   * @param apiPort the port of DSP-API
   * @param apiPath the base path following host and port, if any.
   * @param jsonWebToken token to identify the user
   * @param logErrors determines whether errors should be logged to the console
   */
  constructor(
    public apiProtocol: 'http' | 'https',
    public apiHost: string,
    public apiPort: number | null = null,
    public apiPath: string = '',
    public jsonWebToken: string = '',
    public logErrors: boolean = false
  ) {
    // Remove port in case it's the default one
    if (apiProtocol === KnoraApiConfig.PROTOCOL_HTTP && apiPort === KnoraApiConfig.DEFAULT_PORT_HTTP) {
      this.apiPort = null;
    } else if (apiProtocol === KnoraApiConfig.PROTOCOL_HTTPS && apiPort === KnoraApiConfig.DEFAULT_PORT_HTTPS) {
      this.apiPort = null;
    }
  }
}
