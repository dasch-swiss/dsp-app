/**
 * configuration to instantiate the iiif url.
 *
 * @category Config
 */
export class DspIiifConfig {
    static readonly PROTOCOL_HTTP = 'http';
    static readonly PROTOCOL_HTTPS = 'https';
    static readonly DEFAULT_PORT_HTTP = 80;
    static readonly DEFAULT_PORT_HTTPS = 443;

    /**
     * @param iiifProtocol the protocol of the API (http or https)
     * @param iiifHost the DSP-API base URL
     * @param iiifPort the port of DSP-API
     * @param iiifPath the base path following host and port, if any.
     */
    constructor(
        public iiifProtocol: 'http' | 'https',
        public iiifHost: string,
        public iiifPort: number | null = null,
        public iiifPath: string = ''
    ) {
        // remove port in case it's the default one
        if (
            iiifProtocol === DspIiifConfig.PROTOCOL_HTTP &&
            iiifPort === DspIiifConfig.DEFAULT_PORT_HTTP
        ) {
            this.iiifPort = null;
        } else if (
            iiifProtocol === DspIiifConfig.PROTOCOL_HTTPS &&
            iiifPort === DspIiifConfig.DEFAULT_PORT_HTTPS
        ) {
            this.iiifPort = null;
        }
    }
    /**
     * the full IIIF URL
     */
    get iiifUrl(): string {
        return (
            this.iiifProtocol +
            '://' +
            this.iiifHost +
            (this.iiifPort !== null ? ':' + this.iiifPort : '') +
            this.iiifPath
        );
    }
}
