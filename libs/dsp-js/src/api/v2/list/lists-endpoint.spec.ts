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

  describe('comments parsing (manually-generated test data)', () => {
    const listData = require('../../../../test/data/api/v2/manually-generated/treelist-with-comments.json');

    it('should parse plain string comments', done => {
      ajaxMock.setMockResponse(listData);

      knoraApiConnection.v2.list.getList('http://rdfh.ch/lists/0001/treeList').subscribe((list: ListNodeV2) => {
        // Root node has a plain string comment
        expect(list.comments.length).toEqual(1);
        expect(list.comments[0].value).toEqual('Root node plain string comment');
        expect(list.comments[0].language).toBeUndefined();

        // First child has a plain string comment
        const firstChild = list.children[0];
        expect(firstChild.comments.length).toEqual(1);
        expect(firstChild.comments[0].value).toEqual('Plain string comment without language tag');
        expect(firstChild.comments[0].language).toBeUndefined();

        done();
      });
    });

    it('should parse comments with language tags', done => {
      ajaxMock.setMockResponse(listData);

      knoraApiConnection.v2.list.getList('http://rdfh.ch/lists/0001/treeList').subscribe((list: ListNodeV2) => {
        // Second child has a single comment with language tag
        const secondChild = list.children[1];
        expect(secondChild.comments.length).toEqual(1);
        expect(secondChild.comments[0].value).toEqual('Comment with language tag');
        expect(secondChild.comments[0].language).toEqual('en');

        done();
      });
    });

    it('should parse multiple comments with language tags', done => {
      ajaxMock.setMockResponse(listData);

      knoraApiConnection.v2.list.getList('http://rdfh.ch/lists/0001/treeList').subscribe((list: ListNodeV2) => {
        // Third child has multiple comments with language tags
        const thirdChild = list.children[2];
        expect(thirdChild.comments.length).toEqual(2);
        expect(thirdChild.comments[0].value).toEqual('English comment');
        expect(thirdChild.comments[0].language).toEqual('en');
        expect(thirdChild.comments[1].value).toEqual('Deutscher Kommentar');
        expect(thirdChild.comments[1].language).toEqual('de');

        done();
      });
    });

    it('should handle nodes without comments', done => {
      ajaxMock.setMockResponse(listData);

      knoraApiConnection.v2.list.getList('http://rdfh.ch/lists/0001/treeList').subscribe((list: ListNodeV2) => {
        // Fourth child has no comment
        const fourthChild = list.children[3];
        expect(fourthChild.comments.length).toEqual(0);

        done();
      });
    });
  });
});
