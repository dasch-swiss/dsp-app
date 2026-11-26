import { inject, Injectable } from '@angular/core';
import {
  CreateValue,
  DeleteValue,
  KnoraApiConnection,
  ListNodeV2,
  ReadResource,
  ReadResourceSequence,
  UpdateResource,
  UpdateResourceMetadata,
  UpdateValue,
} from '@dasch-swiss/dsp-js';
import {
  APIV3ApiService,
  BatchChangesRequest,
  BatchChangesResponse,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { map, Observable } from 'rxjs';

/**
 * One change as `POST /v3/resources/values/batch` takes it. The field is `new` on the wire; the generated
 * client names it `_new` and would send that, so callers build this body and `applyBatch` sends it as is.
 */
export interface BulkEditBatchChange {
  resource: string;
  property?: string;
  value?: string;
  expected?: string;
  new?: string;
  expectEmpty?: boolean;
  label?: { expected: string; new: string };
}

/**
 * The dsp-api calls of a bulk edit: reading resources and lists in batches, and writing changes, many per
 * request through the batch route or one at a time like the resource editor. Stateless, so provided in root.
 */
@Injectable({ providedIn: 'root' })
export class BulkEditApiService {
  private readonly _dspApiConnection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _apiV3 = inject(APIV3ApiService);

  /** Up to 100 resources in one request (`POST /v2/resources/batch`). */
  readResources(resourceIris: string[]): Observable<ReadResource[]> {
    return this._dspApiConnection.v2.res
      .getResourcesBatch(resourceIris)
      .pipe(map(sequence => (sequence as ReadResourceSequence).resources));
  }

  readList(rootIri: string): Observable<ListNodeV2> {
    return this._dspApiConnection.v2.list.getList(rootIri) as Observable<ListNodeV2>;
  }

  /** Up to 100 changes; each gets its own result, at its index. */
  applyBatch(changes: BulkEditBatchChange[]): Observable<BatchChangesResponse> {
    // The body follows the wire format (`new`), not the generated model (`_new`).
    return this._apiV3.postV3ResourcesValuesBatch({ changes } as unknown as BatchChangesRequest);
  }

  updateLabel(payload: UpdateResourceMetadata): Observable<unknown> {
    return this._dspApiConnection.v2.res.updateResourceMetadata(payload);
  }

  updateValue(payload: UpdateResource<UpdateValue>): Observable<unknown> {
    return this._dspApiConnection.v2.values.updateValue(payload);
  }

  createValue(payload: UpdateResource<CreateValue>): Observable<unknown> {
    return this._dspApiConnection.v2.values.createValue(payload);
  }

  deleteValue(payload: UpdateResource<DeleteValue>): Observable<unknown> {
    return this._dspApiConnection.v2.values.deleteValue(payload);
  }
}
