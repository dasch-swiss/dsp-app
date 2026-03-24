import { JsonConvert, OperationMode, ValueCheckingMode } from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';
import { of } from 'rxjs';
import { KnoraApiConfig } from '../knora-api-config';
import { KnoraApiConnection } from '../knora-api-connection';
import { ListChildNodeResponse } from '../models/admin/list-child-node-response';
import { ListResponse } from '../models/admin/list-response';
import { ApiResponseData } from '../models/api-response-data';
import { ApiResponseError } from '../models/api-response-error';
import { ListAdminCache } from './ListAdminCache';

describe('ListCache', () => {
  const config = new KnoraApiConfig('http', '0.0.0.0', 3333);
  const knoraApiConnection = new KnoraApiConnection(config);

  let getListSpy: jest.SpyInstance;
  let listCache: ListAdminCache;

  const jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  const list = require('../../test/data/api/admin/lists/get-list-response.json');

  const listResp = jsonConvert.deserializeObject(list, ListResponse);

  beforeEach(() => {
    getListSpy = jest.spyOn(knoraApiConnection.admin.listsEndpoint, 'getList').mockImplementation((listIri: string) => {
      return of({ body: listResp } as ApiResponseData<ListResponse> | ApiResponseData<ListChildNodeResponse>);
    });

    listCache = new ListAdminCache(knoraApiConnection.admin);
  });

  afterEach(() => {
    getListSpy.mockRestore();
  });

  describe('Method getItem', () => {
    it('should get a full list from the cache', done => {
      listCache['getItem']('http://rdfh.ch/lists/0001/treeList').subscribe((res: ListResponse) => {
        expect(res.list.listinfo.id).toEqual('http://rdfh.ch/lists/0001/treeList');

        expect(getListSpy).toHaveBeenCalledTimes(1);

        expect(listCache['cache']['http://rdfh.ch/lists/0001/treeList']).not.toBeUndefined();

        done();
      });
    });

    it('should get the full list from the cache twice synchronously', done => {
      listCache['getItem']('http://rdfh.ch/lists/0001/treeList').subscribe((res: ListResponse) => {
        expect(res.list.listinfo.id).toEqual('http://rdfh.ch/lists/0001/treeList');
        expect(getListSpy).toHaveBeenCalledTimes(1);

        listCache['getItem']('http://rdfh.ch/lists/0001/treeList').subscribe((res2: ListResponse) => {
          expect(res2.list.listinfo.id).toEqual('http://rdfh.ch/lists/0001/treeList');
          expect(getListSpy).toHaveBeenCalledTimes(1);
        });

        done();
      });
    });

    it('should get the same full list from the cache several times asynchronously', () => {
      listCache['getItem']('http://rdfh.ch/lists/0001/treeList').subscribe((res: ListResponse) => {
        expect(getListSpy).toHaveBeenCalledTimes(1);
      });

      listCache['getItem']('http://rdfh.ch/lists/0001/treeList').subscribe((res: ListResponse) => {
        expect(getListSpy).toHaveBeenCalledTimes(1);
      });

      listCache['getItem']('http://rdfh.ch/lists/0001/treeList').subscribe((res: ListResponse) => {
        expect(getListSpy).toHaveBeenCalledTimes(1);
      });

      expect(getListSpy).toHaveBeenCalledTimes(1);
      expect(getListSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList');
    });
  });

  describe('Method reloadCachedItem', () => {
    it('should reload the item in the cache', done => {
      listCache['reloadCachedItem']('http://rdfh.ch/lists/0001/treeList').subscribe((res: ListResponse) => {
        expect(res.list.listinfo.id).toEqual('http://rdfh.ch/lists/0001/treeList');

        expect(getListSpy).toHaveBeenCalledTimes(1);

        expect(listCache['cache']['http://rdfh.ch/lists/0001/treeList']).not.toBeUndefined();

        done();
      });
    });
  });
});
