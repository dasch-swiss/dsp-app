import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseApi } from '../../base-api';
import { ListNode } from './list-node.interface';

@Injectable({
  providedIn: 'root',
})
export class ListV2ApiService extends BaseApi {
  constructor(private _http: HttpClient) {
    super('v2'); // TODO weird
  }

  getNode(nodeIri: string) {
    return this._http.get<ListNode>(
      `${this.baseUri}/node/${encodeURIComponent(nodeIri)}`
    );
  }

  getListWithInterface(nodeIri: string) {
    return this._http.get<ListNode>(
      `${this.baseUri}/lists/${encodeURIComponent(nodeIri)}`
    );
  }
}
