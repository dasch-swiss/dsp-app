import { KnoraApiConfig } from '../../knora-api-config';
import { Endpoint } from '../endpoint';
import { HealthEndpointSystem } from './health/health-endpoint-system';

/**
 * A client API for administering Knora.
 *
 * @category Endpoint System
 */
export class SystemEndpoint extends Endpoint {
  static readonly PATH_HEALTH = '/health';

  /**
   * An endpoint for DSP system health.
   */
  readonly healthEndpoint: HealthEndpointSystem;

  /**
   * Constructor.
   * Sets up all endpoints for this endpoint.
   *
   * @param knoraApiConfig
   * @param path
   */
  constructor(
    protected override readonly knoraApiConfig: KnoraApiConfig,
    protected override readonly path: string
  ) {
    super(knoraApiConfig, path);

    // Instantiate the endpoints
    this.healthEndpoint = new HealthEndpointSystem(knoraApiConfig, path + SystemEndpoint.PATH_HEALTH);
  }
}
