import { AjaxResponse } from 'rxjs/ajax';
import { catchError, map, mergeMap } from 'rxjs';
import { ListNodeV2Cache } from '../../../cache/ListNodeV2Cache';
import { OntologyCache } from '../../../cache/ontology-cache/OntologyCache';
import { KnoraApiConfig } from '../../../knora-api-config';
import { ReadResourceSequence } from '../../../models/v2/resources/read/read-resource-sequence';
import { ResourcesConversionUtil } from '../../../models/v2/resources/ResourcesConversionUtil';
import { UpdateResource } from '../../../models/v2/resources/update/update-resource';
import { CreateFileValue } from '../../../models/v2/resources/values/create/create-file-value';
import { CreateValue } from '../../../models/v2/resources/values/create/create-value';
import { DeleteValue } from '../../../models/v2/resources/values/delete/delete-value';
import { DeleteValueResponse } from '../../../models/v2/resources/values/delete/delete-value-response';
import { UpdateValue } from '../../../models/v2/resources/values/update/update-value';
import { WriteValueResponse } from '../../../models/v2/resources/values/write-value-response';
import { Endpoint } from '../../endpoint';
import { V2Endpoint } from '../v2-endpoint';

declare let require: any; // http://stackoverflow.com/questions/34730010/angular2-5-minute-install-bug-require-is-not-defined
const jsonld = require('jsonld/dist/jsonld.js');

/**
 * Handles requests to the values route of the Knora API.
 *
 * @category Endpoint V2
 */
export class ValuesEndpointV2 extends Endpoint {
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
   * Reads a value from Knora.
   *
   * @param resourceIri the Iri of the resource the value belongs to.
   * @param valueUuid the value's UUID.
   */
  getValue(resourceIri: string, valueUuid: string) {
    // Create temporary caches for this request only
    // These will be garbage collected after the request completes
    const tempOntologyCache = new OntologyCache(this.knoraApiConfig, this.v2Endpoint);
    const tempListNodeCache = new ListNodeV2Cache(this.v2Endpoint);

    return this.httpGet('/' + encodeURIComponent(resourceIri) + '/' + encodeURIComponent(valueUuid)).pipe(
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
   * Updates an existing value.
   *
   * @param resource The resource with the value to be updated.
   */
  updateValue(resource: UpdateResource<UpdateValue>) {
    const res = this.jsonConvert.serializeObject<UpdateResource<UpdateValue>>(resource);

    const val = this.jsonConvert.serializeObject<UpdateValue>(resource.value);

    res[resource.property] = val;

    return this.httpPut('', res, 'json', { 'X-Asset-Ingested': 'true' }).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map(jsonldobj => {
        return this.jsonConvert.deserializeObject(jsonldobj as object, WriteValueResponse);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Creates a new value.
   *
   * @param resource The resource with the value to be created.
   */
  createValue(resource: UpdateResource<CreateValue>) {
    const res = this.jsonConvert.serializeObject<UpdateResource<CreateValue>>(resource);

    if (resource.value instanceof CreateFileValue) {
      throw Error('A value of type CreateFileValue can only be created with a new resource');
    }

    const val = this.jsonConvert.serializeObject<CreateValue>(resource.value);

    res[resource.property] = val;

    return this.httpPost('', res, 'json', { 'X-Asset-Ingested': 'true' }).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map(jsonldobj => {
        return this.jsonConvert.deserializeObject(jsonldobj as object, WriteValueResponse);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Deletes a value.
   *
   * @param resource The resource with the value to be deleted.
   */
  deleteValue(resource: UpdateResource<DeleteValue>) {
    const res = this.jsonConvert.serializeObject<UpdateResource<DeleteValue>>(resource);

    const val = this.jsonConvert.serializeObject<DeleteValue>(resource.value);

    res[resource.property] = val;

    return this.httpPost('/delete', res).pipe(
      mergeMap(ajaxResponse => {
        // console.log(JSON.stringify(ajaxResponse.response));
        // TODO: @rosenth Adapt context object
        // TODO: adapt getOntologyIriFromEntityIri
        return jsonld.compact(ajaxResponse.response, {}) as Promise<object>;
      }),
      map(jsonldobj => {
        return this.jsonConvert.deserializeObject(jsonldobj as object, DeleteValueResponse);
      }),
      catchError(error => this.handleError(error))
    );
  }
}
