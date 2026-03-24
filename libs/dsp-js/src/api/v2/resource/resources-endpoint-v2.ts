import { Observable } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { catchError, map, mergeMap } from 'rxjs';
import { ListNodeV2Cache } from '../../../cache/ListNodeV2Cache';
import { OntologyCache } from '../../../cache/ontology-cache/OntologyCache';
import { KnoraApiConfig } from '../../../knora-api-config';
import { ApiResponseError } from '../../../models/api-response-error';
import { CanDoResponse } from '../../../models/v2/ontologies/read/can-do-response';
import { CreateResource } from '../../../models/v2/resources/create/create-resource';
import { DeleteResource } from '../../../models/v2/resources/delete/delete-resource';
import { DeleteResourceResponse } from '../../../models/v2/resources/delete/delete-resource-response';
import { ReadResource } from '../../../models/v2/resources/read/read-resource';
import { ReadResourceSequence } from '../../../models/v2/resources/read/read-resource-sequence';
import { ResourcesConversionUtil } from '../../../models/v2/resources/ResourcesConversionUtil';
import { UpdateResourceMetadata } from '../../../models/v2/resources/update/update-resource-metadata';
import { UpdateResourceMetadataResponse } from '../../../models/v2/resources/update/update-resource-metadata-response';
import { Endpoint } from '../../endpoint';
import { V2Endpoint } from '../v2-endpoint';

declare let require: any; // http://stackoverflow.com/questions/34730010/angular2-5-minute-install-bug-require-is-not-defined
const jsonld = require('jsonld/dist/jsonld.js');

/**
 * Handles requests to the resources route of the Knora API.
 *
 * @category Endpoint V2
 */
export class ResourcesEndpointV2 extends Endpoint {
  /**
   * @category Internal
   * @param knoraApiConfig the config object.
   * @param path this endpoint's base path.
   * @param v2Endpoint a reference to the v2 endpoint.
   */
  constructor(
    protected override readonly knoraApiConfig: KnoraApiConfig,
    protected override readonly path: string,
    private readonly v2Endpoint: V2Endpoint
  ) {
    super(knoraApiConfig, path);
  }

  /**
   * Given a sequence of resource IRIs, gets the resources from Knora.
   *
   * @param resourceIris Iris of the resources to get.
   * @param version Timestamp of the resource version.
   */
  getResources(resourceIris: string[], version?: string) {
    // TODO: Do not hard-code the URL and http call params, generate this from Knora

    // make URL containing resource Iris as segments
    const resIris: string = resourceIris
      .map((resIri: string) => {
        return '/' + encodeURIComponent(resIri) + (version ? '?version=' + version : '');
      })
      .reduce((acc, currentValue) => {
        return acc + currentValue;
      });

    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpGet(resIris).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      mergeMap((jsonldobj: object) => {
        // console.log(JSON.stringify(jsonldobj));
        return ResourcesConversionUtil.createReadResourceSequence(
          jsonldobj,
          tempOntologyCache,
          tempListNodeCache,
          this.jsonConvert
        );
      }),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Given a resource IRI, gets the resource from Knora.
   *
   * @param resourceIri Iri of the resource to get.
   * @param version Timestamp of the resource version.
   */
  getResource(resourceIri: string, version?: string) {
    return this.getResources([resourceIri], version).pipe(
      map((resources: ReadResourceSequence) => resources.resources[0]),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Creates a new resource.
   *
   * @param resource the resource to be created.
   */
  createResource(resource: CreateResource) {
    const res = this.jsonConvert.serializeObject(resource);

    // get property Iris
    const propIris = Object.keys(resource.properties);

    // for each property, serialize its values
    // and assign them to the resource
    propIris.forEach(propIri => {
      // check that array contains least one value
      if (resource.properties[propIri].length === 0) {
        throw new Error('No values defined for ' + propIri);
      }

      // if array contains only one element, serialize as an object
      if (resource.properties[propIri].length === 1) {
        res[propIri] = this.jsonConvert.serializeObject(resource.properties[propIri][0]);
      } else {
        res[propIri] = this.jsonConvert.serializeArray(resource.properties[propIri]);
      }
    });

    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpPost('', res, 'json', { 'X-Asset-Ingested': 'true' }).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      mergeMap((jsonldobj: object) => {
        // console.log(JSON.stringify(jsonldobj));
        return ResourcesConversionUtil.createReadResourceSequence(
          jsonldobj,
          tempOntologyCache,
          tempListNodeCache,
          this.jsonConvert
        );
      }),
      map((resources: ReadResourceSequence) => resources.resources[0]),
      catchError(error => {
        return this.handleError(error);
      })
    );
  }

  /**
   * Updates a resource's metadata.
   *
   * @param resourceMetadata the new metadata.
   */
  updateResourceMetadata(resourceMetadata: UpdateResourceMetadata) {
    // check that at least one of the following properties is updated: label, hasPermissions, newModificationDate
    if (
      resourceMetadata.label === undefined &&
      resourceMetadata.hasPermissions === undefined &&
      resourceMetadata.newModificationDate === undefined
    ) {
      throw new Error(
        'At least one of the following properties has to be updated: label, hasPermissions, newModificationDate'
      );
    }

    const res = this.jsonConvert.serializeObject(resourceMetadata);

    return this.httpPut('', res).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map(jsonldobj => {
        return this.jsonConvert.deserializeObject(jsonldobj as object, UpdateResourceMetadataResponse);
      }),
      catchError(error => this.handleError(error))
    );
  }
  /**
   * Checks whether a resource can be deleted or not.
   *
   * @param resource the resource to check.
   */
  canDeleteResource(resource: DeleteResource): Observable<CanDoResponse | ApiResponseError> {
    const res = JSON.stringify(this.jsonConvert.serializeObject(resource));

    return this.httpGet(`/candelete?jsonLd=${encodeURIComponent(res)}`).pipe(
      mergeMap(ajaxResponse => {
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map(jsonldobj => {
        return this.jsonConvert.deserializeObject(jsonldobj as object, CanDoResponse);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Deletes a resource.
   *
   * @param resource the resource to be deleted.
   */
  deleteResource(resource: DeleteResource) {
    const res = this.jsonConvert.serializeObject(resource);

    return this.httpPost('/delete', res).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map(jsonldobj => {
        return this.jsonConvert.deserializeObject(jsonldobj as object, DeleteResourceResponse);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Erases a resource.
   *
   * @param resource the resource to be deleted.
   */
  eraseResource(resource: DeleteResource) {
    const res = this.jsonConvert.serializeObject(resource);

    return this.httpPost('/erase', res).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map(jsonldobj => {
        return this.jsonConvert.deserializeObject(jsonldobj as object, DeleteResourceResponse);
      }),
      catchError(error => this.handleError(error))
    );
  }
}
