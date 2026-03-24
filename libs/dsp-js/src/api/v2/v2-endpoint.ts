import { ListNodeV2Cache } from '../../cache/ListNodeV2Cache';
import { OntologyCache } from '../../cache/ontology-cache/OntologyCache';
import { KnoraApiConfig } from '../../knora-api-config';
import { Endpoint } from '../endpoint';
import { AuthenticationEndpointV2 } from './authentication/authentication-endpoint-v2';
import { ListsEndpointV2 } from './list/lists-endpoint-v2';
import { OntologiesEndpointV2 } from './ontology/ontologies-endpoint-v2';
import { ResourcesEndpointV2 } from './resource/resources-endpoint-v2';
import { SearchEndpointV2 } from './search/search-endpoint-v2';
import { ValuesEndpointV2 } from './values/values-endpoint-v2';

/**
 * Defines the V2 endpoint of the Knora API.
 *
 * @category Endpoint V2
 */
export class V2Endpoint extends Endpoint {
  private static readonly PATH_AUTHENTICATION = '/authentication';

  private static readonly PATH_ONTOLOGIES = '/ontologies';

  private static readonly PATH_RESOURCES = '/resources';

  private static readonly PATH_VALUES = '/values';

  private static readonly PATH_METADATA = '/metadata';

  readonly auth: AuthenticationEndpointV2;

  readonly onto: OntologiesEndpointV2;

  readonly res: ResourcesEndpointV2;

  readonly values: ValuesEndpointV2;

  readonly list: ListsEndpointV2;

  readonly search: SearchEndpointV2;

  /**
   * @deprecated This cache is kept for backwards compatibility with existing tests.
   * Production code should NOT use this cache - endpoints create temporary caches per request.
   * @category Internal
   */
  readonly ontologyCache: OntologyCache;

  /**
   * @deprecated This cache is kept for backwards compatibility with existing tests.
   * Production code should NOT use this cache - endpoints create temporary caches per request.
   * @category Internal
   */
  readonly listNodeCache: ListNodeV2Cache;

  /**
   * Sets up all endpoints for this endpoint.
   *
   * @param knoraApiConfig the configuration for the DSP-API instance to connect to.
   * @param path this endpoint's path segment.
   *
   * @category Internal
   */
  constructor(
    protected override readonly knoraApiConfig: KnoraApiConfig,
    protected override readonly path: string
  ) {
    super(knoraApiConfig, path);

    // Instantiate the endpoints
    this.auth = new AuthenticationEndpointV2(knoraApiConfig, path + V2Endpoint.PATH_AUTHENTICATION);
    this.onto = new OntologiesEndpointV2(knoraApiConfig, path + V2Endpoint.PATH_ONTOLOGIES);
    this.res = new ResourcesEndpointV2(knoraApiConfig, path + V2Endpoint.PATH_RESOURCES, this);
    this.values = new ValuesEndpointV2(knoraApiConfig, path + V2Endpoint.PATH_VALUES, this);
    this.list = new ListsEndpointV2(knoraApiConfig, path);
    this.search = new SearchEndpointV2(knoraApiConfig, path, this);

    // Initialize deprecated caches for test compatibility only
    // These are NOT used by production code - endpoints create temporary caches per request
    this.ontologyCache = new OntologyCache(knoraApiConfig, this);
    this.listNodeCache = new ListNodeV2Cache(this);
  }
}
