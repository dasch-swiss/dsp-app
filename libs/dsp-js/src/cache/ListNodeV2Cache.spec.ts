import { of } from 'rxjs';
import { MockList } from '../../test/data/api/v2/mock-list';
import { KnoraApiConfig } from '../knora-api-config';
import { KnoraApiConnection } from '../knora-api-connection';
import { ListNodeV2 } from '../models/v2/lists/list-node-v2';

describe('ListNodeV2Cache', () => {
  const config = new KnoraApiConfig('http', '0.0.0.0', 3333, '', '', true);
  let knoraApiConnection: KnoraApiConnection;

  let getNodeSpy: jest.SpyInstance;
  let getListSpy: jest.SpyInstance;

  beforeEach(() => {
    knoraApiConnection = new KnoraApiConnection(config);

    getNodeSpy = jest.spyOn(knoraApiConnection.v2.list, 'getNode').mockImplementation((nodeIri: string) => {
      return of(MockList.mockNode(nodeIri));
    });

    getListSpy = jest.spyOn(knoraApiConnection.v2.list, 'getList').mockImplementation((nodeIri: string) => {
      return of(MockList.mockList(nodeIri));
    });
  });

  afterEach(() => {
    getNodeSpy.mockRestore();
    getListSpy.mockRestore();
  });

  describe('Method getItem()', () => {
    it('should get a list node from the cache', done => {
      knoraApiConnection.v2.listNodeCache['getItem']('http://rdfh.ch/lists/0001/treeList01').subscribe(
        (node: ListNodeV2) => {
          expect(node.id).toEqual('http://rdfh.ch/lists/0001/treeList01');

          expect(getNodeSpy).toHaveBeenCalledTimes(1);
          expect(getNodeSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList01');

          expect(getListSpy).toHaveBeenCalledTimes(1);
          expect(getListSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList');

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList01']
          ).not.toBeUndefined();

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList']
          ).not.toBeUndefined(); // root node Iri is a dependency of each list node

          // since the test uses a sync Observable to retrieve the whole list, the information is present
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList02']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList03']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList10']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList11']
          ).not.toBeUndefined();

          done();
        }
      );
    });

    it('should get a list node from the cache several times asynchronously', done => {
      knoraApiConnection.v2.listNodeCache['getItem']('http://rdfh.ch/lists/0001/treeList01').subscribe(
        (node: ListNodeV2) => {
          expect(node.id).toEqual('http://rdfh.ch/lists/0001/treeList01');

          expect(getNodeSpy).toHaveBeenCalledTimes(1);
          expect(getNodeSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList01');

          expect(getListSpy).toHaveBeenCalledTimes(1);
          expect(getListSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList');

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList01']
          ).not.toBeUndefined();

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList']
          ).not.toBeUndefined(); // root node Iri is a dependency of each list node

          // since the test uses a sync Observable to retrieve the whole list, the information is present
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList02']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList03']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList10']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList11']
          ).not.toBeUndefined();
        }
      );

      knoraApiConnection.v2.listNodeCache['getItem']('http://rdfh.ch/lists/0001/treeList01').subscribe(
        (node: ListNodeV2) => {
          expect(node.id).toEqual('http://rdfh.ch/lists/0001/treeList01');

          expect(getNodeSpy).toHaveBeenCalledTimes(1);
          expect(getNodeSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList01');

          expect(getListSpy).toHaveBeenCalledTimes(1);
          expect(getListSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList');

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList01']
          ).not.toBeUndefined();

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList']
          ).not.toBeUndefined(); // root node Iri is a dependency of each list node

          // since the test uses a sync Observable to retrieve the whole list, the information is present
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList02']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList03']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList10']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList11']
          ).not.toBeUndefined();
        }
      );

      knoraApiConnection.v2.listNodeCache['getItem']('http://rdfh.ch/lists/0001/treeList01').subscribe(
        (node: ListNodeV2) => {
          expect(node.id).toEqual('http://rdfh.ch/lists/0001/treeList01');

          expect(getNodeSpy).toHaveBeenCalledTimes(1);
          expect(getNodeSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList01');

          expect(getListSpy).toHaveBeenCalledTimes(1);
          expect(getListSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList');

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList01']
          ).not.toBeUndefined();

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList']
          ).not.toBeUndefined(); // root node Iri is a dependency of each list node

          // since the test uses a sync Observable to retrieve the whole list, the information is present
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList02']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList03']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList10']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList11']
          ).not.toBeUndefined();
          done();
        }
      );
    });
  });

  describe('Method getNode()', () => {
    it('should get a list node from the cache', done => {
      knoraApiConnection.v2.listNodeCache
        .getNode('http://rdfh.ch/lists/0001/treeList01')
        .subscribe((node: ListNodeV2) => {
          expect(node.id).toEqual('http://rdfh.ch/lists/0001/treeList01');

          expect(getNodeSpy).toHaveBeenCalledTimes(1);
          expect(getNodeSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList01');

          expect(getListSpy).toHaveBeenCalledTimes(1);
          expect(getListSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList');

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList01']
          ).not.toBeUndefined();

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList']
          ).not.toBeUndefined(); // root node Iri is a dependency of each list node

          // since the test uses a sync Observable to retrieve the whole list, the information is present
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList02']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList03']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList10']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList11']
          ).not.toBeUndefined();

          done();
        });
    });
  });

  describe('Method reloadCachedItem', () => {
    it('should reload the item in the cache', done => {
      knoraApiConnection.v2.listNodeCache['reloadCachedItem']('http://rdfh.ch/lists/0001/treeList01').subscribe(
        (node: ListNodeV2) => {
          expect(node.id).toEqual('http://rdfh.ch/lists/0001/treeList01');

          expect(getNodeSpy).toHaveBeenCalledTimes(1);
          expect(getNodeSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList01');

          expect(getListSpy).toHaveBeenCalledTimes(1);
          expect(getListSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList');

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList01']
          ).not.toBeUndefined();

          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList']
          ).not.toBeUndefined(); // root node Iri is a dependency of each list node

          // since the test uses a sync Observable to retrieve the whole list, the information is present
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList02']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList03']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList10']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.listNodeCache['cache']['http://rdfh.ch/lists/0001/treeList11']
          ).not.toBeUndefined();

          done();
        }
      );
    });
  });
});
