import { setupAjaxMock, AjaxMock } from '../../../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { ListNodeV2 } from '../../../models/v2/lists/list-node-v2';

describe('ListsEndpoint', () => {
  const config = new KnoraApiConfig('http', '0.0.0.0', 3333, undefined, undefined, true);
  const knoraApiConnection = new KnoraApiConnection(config);

  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();
  });

  afterEach(() => {
    ajaxMock.cleanup();
  });

  it('should return a list', done => {
    const onto = require('../../../../test/data/api/v2/lists/treelist.json');

    ajaxMock.setMockResponse(onto);

    knoraApiConnection.v2.list.getList('http://rdfh.ch/lists/0001/treeList').subscribe((list: ListNodeV2) => {
      expect(list.id).toEqual('http://rdfh.ch/lists/0001/treeList');
      expect(list.children.length).toEqual(3);

      const request = ajaxMock.getLastRequest();

      expect(request?.url).toBe('http://0.0.0.0:3333/v2/lists/http%3A%2F%2Frdfh.ch%2Flists%2F0001%2FtreeList');

      expect(request?.method).toEqual('GET');

      done();
    });
  });

  it('should return a list node', done => {
    const onto = require('../../../../test/data/api/v2/lists/listnode.json');

    ajaxMock.setMockResponse(onto);

    knoraApiConnection.v2.list.getNode('http://rdfh.ch/lists/0001/treeList01').subscribe((list: ListNodeV2) => {
      expect(list.id).toEqual('http://rdfh.ch/lists/0001/treeList01');
      expect(list.children.length).toEqual(0);

      const request = ajaxMock.getLastRequest();

      expect(request?.url).toBe('http://0.0.0.0:3333/v2/node/http%3A%2F%2Frdfh.ch%2Flists%2F0001%2FtreeList01');

      expect(request?.method).toEqual('GET');

      done();
    });
  });
});
