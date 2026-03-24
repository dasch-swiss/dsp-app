import { of } from 'rxjs';
import { ListNodeV2Cache } from '../../../cache/ListNodeV2Cache';
import { OntologyCache } from '../../../cache/ontology-cache/OntologyCache';
import { MockList } from '../../../../test/data/api/v2/mock-list';
import { MockOntology } from '../../../../test/data/api/v2/mock-ontology';
import { setupAjaxMock, AjaxMock } from '../../../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { Constants } from '../../../models/v2/Constants';
import { ReadResource } from '../../../models/v2/resources/read/read-resource';
import { UpdateResource } from '../../../models/v2/resources/update/update-resource';
import { CreateBooleanValue } from '../../../models/v2/resources/values/create/create-boolean-value';
import { CreateColorValue } from '../../../models/v2/resources/values/create/create-color-value';
import { CreateDateValue } from '../../../models/v2/resources/values/create/create-date-value';
import { CreateDecimalValue } from '../../../models/v2/resources/values/create/create-decimal-value';
import {
  CreateStillImageFileValue,
  CreateStillImageVectorFileValue,
} from '../../../models/v2/resources/values/create/create-file-value';
import { CreateGeomValue } from '../../../models/v2/resources/values/create/create-geom-value';
import { CreateGeonameValue } from '../../../models/v2/resources/values/create/create-geoname-value';
import { CreateIntValue } from '../../../models/v2/resources/values/create/create-int-value';
import { CreateIntervalValue } from '../../../models/v2/resources/values/create/create-interval-value';
import { CreateLinkValue } from '../../../models/v2/resources/values/create/create-link-value';
import { CreateListValue } from '../../../models/v2/resources/values/create/create-list-value';
import {
  CreateTextValueAsString,
  CreateTextValueAsXml,
} from '../../../models/v2/resources/values/create/create-text-value';
import { CreateTimeValue } from '../../../models/v2/resources/values/create/create-time-value';
import { CreateUriValue } from '../../../models/v2/resources/values/create/create-uri-value';
import { CreateValue } from '../../../models/v2/resources/values/create/create-value';
import { DeleteValue } from '../../../models/v2/resources/values/delete/delete-value';
import { DeleteValueResponse } from '../../../models/v2/resources/values/delete/delete-value-response';
import { ReadBooleanValue } from '../../../models/v2/resources/values/read/read-boolean-value';
import { ReadColorValue } from '../../../models/v2/resources/values/read/read-color-value';
import { KnoraDate, ReadDateValue } from '../../../models/v2/resources/values/read/read-date-value';
import { ReadDecimalValue } from '../../../models/v2/resources/values/read/read-decimal-value';
import {
  ReadStillImageExternalFileValue,
  ReadStillImageFileValue,
  ReadStillImageVectorFileValue,
} from '../../../models/v2/resources/values/read/read-file-value';
import { ReadGeomValue } from '../../../models/v2/resources/values/read/read-geom-value';
import { ReadGeonameValue } from '../../../models/v2/resources/values/read/read-geoname-value';
import { ReadIntValue } from '../../../models/v2/resources/values/read/read-int-value';
import { ReadIntervalValue } from '../../../models/v2/resources/values/read/read-interval-value';
import { ReadLinkValue } from '../../../models/v2/resources/values/read/read-link-value';
import { ReadListValue } from '../../../models/v2/resources/values/read/read-list-value';
import { ReadTextValueAsString, ReadTextValueAsXml } from '../../../models/v2/resources/values/read/read-text-value';
import { ReadTimeValue } from '../../../models/v2/resources/values/read/read-time-value';
import { UpdateBooleanValue } from '../../../models/v2/resources/values/update/update-boolean-value';
import { UpdateColorValue } from '../../../models/v2/resources/values/update/update-color-value';
import { UpdateDateValue } from '../../../models/v2/resources/values/update/update-date-value';
import { UpdateDecimalValue } from '../../../models/v2/resources/values/update/update-decimal-value';
import {
  UpdateStillImageFileValue,
  UpdateStillImageVectorFileValue,
} from '../../../models/v2/resources/values/update/update-file-value';
import { UpdateGeomValue } from '../../../models/v2/resources/values/update/update-geom-value';
import { UpdateGeonameValue } from '../../../models/v2/resources/values/update/update-geoname-value';
import { UpdateIntValue } from '../../../models/v2/resources/values/update/update-int-value';
import { UpdateIntervalValue } from '../../../models/v2/resources/values/update/update-interval-value';
import { UpdateLinkValue } from '../../../models/v2/resources/values/update/update-link-value';
import { UpdateListValue } from '../../../models/v2/resources/values/update/update-list-value';
import {
  UpdateTextValueAsString,
  UpdateTextValueAsXml,
} from '../../../models/v2/resources/values/update/update-text-value';
import { UpdateTimeValue } from '../../../models/v2/resources/values/update/update-time-value';
import { UpdateUriValue } from '../../../models/v2/resources/values/update/update-uri-value';
import { UpdateValue } from '../../../models/v2/resources/values/update/update-value';
import { UpdateValuePermissions } from '../../../models/v2/resources/values/update/update-value-permissions';
import { WriteValueResponse } from '../../../models/v2/resources/values/write-value-response';

const config = new KnoraApiConfig('http', '0.0.0.0', 3333, undefined, undefined, true);
let knoraApiConnection: KnoraApiConnection;

let getResourceClassDefinitionFromCacheSpy: jest.SpyInstance;
let getListNodeFromCacheSpy: jest.SpyInstance;

namespace WriteValueMocks {
  const mockWriteValueResponse = (id: string, type: string, uuid: string, creationDate?: string): object => {
    const res: { [index: string]: string | object } = {
      '@id': id,
      '@type': type,
      [Constants.ValueHasUUID]: uuid,
    };

    if (creationDate !== undefined) {
      res[Constants.ValueCreationDate] = {
        '@type': 'http://www.w3.org/2001/XMLSchema#dateTimeStamp',
        '@value': creationDate,
      };
    }

    return res;
  };

  export const mockUpdateValueResponse = (id: string, type: string, uuid: string): object => {
    return mockWriteValueResponse(id, type, uuid);
  };

  export const mockCreateValueResponse = (id: string, type: string, uuid: string, creationDate: string): object => {
    return mockWriteValueResponse(id, type, uuid, creationDate);
  };
}

describe('ValuesEndpoint', () => {
  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();

    // Mock cache methods at the prototype level
    // This ensures ALL cache instances (including temporary ones) get the mocks
    getResourceClassDefinitionFromCacheSpy = jest
      .spyOn(OntologyCache.prototype, 'getResourceClassDefinition')
      .mockImplementation((resClassIri: string) =>
        of(MockOntology.mockIResourceClassAndPropertyDefinitions(resClassIri))
      );

    getListNodeFromCacheSpy = jest
      .spyOn(ListNodeV2Cache.prototype, 'getNode')
      .mockImplementation((listNodeIri: string) => of(MockList.mockNode(listNodeIri)));

    knoraApiConnection = new KnoraApiConnection(config);
  });

  afterEach(() => {
    ajaxMock.cleanup();
    getResourceClassDefinitionFromCacheSpy.mockRestore();
    getListNodeFromCacheSpy.mockRestore();
  });

  describe('Method getValue', () => {
    it('should read an integer value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-int-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'dJ1ES8QTQNepFKF5-EAqdg')
        .subscribe((res: ReadResource) => {
          const intVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger', ReadIntValue);
          expect(intVal.length).toEqual(1);
          expect(intVal[0].int).toEqual(1);

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/dJ1ES8QTQNepFKF5-EAqdg'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a decimal value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-decimal-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'bXMwnrHvQH2DMjOFrGmNzg-EAqdg')
        .subscribe((res: ReadResource) => {
          const decVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal', ReadDecimalValue);
          expect(decVal.length).toEqual(1);
          expect(decVal[0].decimal).toBeCloseTo(1.5, 1);

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/bXMwnrHvQH2DMjOFrGmNzg-EAqdg'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a color value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-color-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'TAziKNP8QxuyhC4Qf9-b6w')
        .subscribe((res: ReadResource) => {
          const colorVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor', ReadColorValue);
          expect(colorVal.length).toEqual(1);
          expect(colorVal[0].color).toEqual('#ff3333');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/TAziKNP8QxuyhC4Qf9-b6w'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read an interval value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-interval-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'RbDKPKHWTC-0lkRKae-E6A')
        .subscribe((res: ReadResource) => {
          const intervalVal = res.getValuesAs(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval',
            ReadIntervalValue
          );
          expect(intervalVal.length).toEqual(1);
          expect(intervalVal[0].start).toEqual(0);
          expect(intervalVal[0].end).toEqual(216000);

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/RbDKPKHWTC-0lkRKae-E6A'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read an Boolean value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-boolean-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'IN4R19yYR0ygi3K2VEHpUQ')
        .subscribe((res: ReadResource) => {
          const boolVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean', ReadBooleanValue);
          expect(boolVal.length).toEqual(1);
          expect(boolVal[0].bool).toBeTruthy();

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/IN4R19yYR0ygi3K2VEHpUQ'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a list value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-list-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'XAhEeE3kSVqM4JPGdLt4Ew')
        .subscribe((res: ReadResource) => {
          const listVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem', ReadListValue);
          expect(listVal.length).toEqual(1);
          expect(listVal[0].listNode).toEqual('http://rdfh.ch/lists/0001/treeList01');
          expect(listVal[0].listNodeLabel).toEqual('Tree list node 01');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getListNodeFromCacheSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList01');

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/XAhEeE3kSVqM4JPGdLt4Ew'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read an link value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-link-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'uvRVxzL1RD-t9VIQ1TpfUw')
        .subscribe((res: ReadResource) => {
          const linkVal = res.getValuesAs(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue',
            ReadLinkValue
          );
          expect(linkVal.length).toEqual(1);
          expect(linkVal[0].linkedResourceIri).toEqual('http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(2);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/uvRVxzL1RD-t9VIQ1TpfUw'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a text value without standoff', done => {
      const resource = require('../../../../test/data/api/v2/values/get-text-value-without-standoff-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'SZyeLLmOTcCCuS3B0VksHQ')
        .subscribe((res: ReadResource) => {
          const textVal = res.getValuesAs(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText',
            ReadTextValueAsString
          );
          expect(textVal.length).toEqual(1);
          expect(textVal[0].text).toEqual('test');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/SZyeLLmOTcCCuS3B0VksHQ'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a text value with standoff', done => {
      const resource = require('../../../../test/data/api/v2/values/get-text-value-with-standoff-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'rvB4eQ5MTF-Qxq0YgkwaDg')
        .subscribe((res: ReadResource) => {
          const textVal = res.getValuesAs(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext',
            ReadTextValueAsXml
          );
          expect(textVal.length).toEqual(1);
          expect(textVal[0].xml).toEqual(
            '<?xml version="1.0" encoding="UTF-8"?>\n<text><p>test with <strong>markup</strong></p></text>'
          );
          expect(textVal[0].mapping).toEqual('http://rdfh.ch/standoff/mappings/StandardMapping');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/rvB4eQ5MTF-Qxq0YgkwaDg'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a date value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-date-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', '-rG4F5FTTu2iB5mTBPVn5Q')
        .subscribe((res: ReadResource) => {
          const dateVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate', ReadDateValue);
          expect(dateVal.length).toEqual(1);
          expect(dateVal[0].date instanceof KnoraDate).toBeTruthy();
          expect((dateVal[0].date as KnoraDate).calendar).toEqual('GREGORIAN');
          expect((dateVal[0].date as KnoraDate).day).toEqual(13);
          expect((dateVal[0].date as KnoraDate).month).toEqual(5);
          expect((dateVal[0].date as KnoraDate).year).toEqual(2018);
          expect((dateVal[0].date as KnoraDate).era).toEqual('CE');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/-rG4F5FTTu2iB5mTBPVn5Q'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a date value (Islamic)', done => {
      // test data for Islamic date has been created manually!

      const resource = require('../../../../test/data/api/v2/manually-generated/get-islamic-date-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', '-rG4F5FTTu2iB5mTBPVn5Q')
        .subscribe((res: ReadResource) => {
          const dateVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate', ReadDateValue);
          expect(dateVal.length).toEqual(1);
          expect(dateVal[0].date instanceof KnoraDate).toBeTruthy();
          expect((dateVal[0].date as KnoraDate).calendar).toEqual('ISLAMIC');
          expect((dateVal[0].date as KnoraDate).day).toEqual(27);
          expect((dateVal[0].date as KnoraDate).month).toEqual(8);
          expect((dateVal[0].date as KnoraDate).year).toEqual(1439);
          expect((dateVal[0].date as KnoraDate).era).toEqual('noEra');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/-rG4F5FTTu2iB5mTBPVn5Q'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a still image file value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-still-image-file-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'goZ7JFRNSeqF-dNxsqAS7Q')
        .subscribe((res: ReadResource) => {
          const stillImageVal = res.getValuesAs(
            'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue',
            ReadStillImageFileValue
          );
          expect(stillImageVal.length).toEqual(1);
          expect(stillImageVal[0].filename).toEqual('B1D0OkEgfFp-Cew2Seur7Wi.jp2');
          expect(stillImageVal[0].dimX).toEqual(512);

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#ThingPicture'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/goZ7JFRNSeqF-dNxsqAS7Q'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read an external image file value', done => {
      const resource = require('../../../../test/data/api/v2/manually-generated/get-still-image-external-file-value-response.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0803/RRjceJu5S86zfc_-ZrIEtg', '1-COzXfuTXiwDJ_2GZxeoQ')
        .subscribe((res: ReadResource) => {
          const externalImageVal = res.getValuesAs(
            'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue',
            ReadStillImageExternalFileValue
          );
          expect(externalImageVal.length).toEqual(1);
          expect(externalImageVal[0].externalUrl).toEqual(
            'https://ids.lib.harvard.edu/ids/iiif/24209711/full/105,/0/default.jpg'
          );

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#ThingPicture'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0803%2FRRjceJu5S86zfc_-ZrIEtg/1-COzXfuTXiwDJ_2GZxeoQ'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a geometry value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-geom-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'we-ybmj-SRen-91n4RaDOQ')
        .subscribe((res: ReadResource) => {
          const geomVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeometry', ReadGeomValue);
          expect(geomVal.length).toEqual(1);
          expect(geomVal[0].geometry.type).toEqual('rectangle');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/we-ybmj-SRen-91n4RaDOQ'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a Geoname value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-geoname-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'hty-ONF8SwKN2RKU7rLKDg')
        .subscribe((res: ReadResource) => {
          const geomVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname', ReadGeonameValue);
          expect(geomVal.length).toEqual(1);
          expect(geomVal[0].geoname).toEqual('2661604');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/hty-ONF8SwKN2RKU7rLKDg'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should read a time value', done => {
      const resource = require('../../../../test/data/api/v2/values/get-time-value-response-expanded.json');

      ajaxMock.setMockResponse(resource);

      knoraApiConnection.v2.values
        .getValue('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw', 'l6DhS5SCT9WhXSoYEZRTRw')
        .subscribe((res: ReadResource) => {
          const geomVal = res.getValuesAs('http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp', ReadTimeValue);
          expect(geomVal.length).toEqual(1);
          expect(geomVal[0].time).toEqual('2019-08-30T10:45:20.173572Z');

          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(1);
          expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
          );

          expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(0);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe(
            'http://0.0.0.0:3333/v2/values/http%3A%2F%2Frdfh.ch%2F0001%2FH6gBWUuJSuuO-CilHV8kQw/l6DhS5SCT9WhXSoYEZRTRw'
          );

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });

  describe('Method updateValue', () => {
    it('should check mocked update value response', () => {
      const mockedUpdateIntValueResponse = WriteValueMocks.mockUpdateValueResponse(
        'http://rdfh.ch/0001/a-thing/values/ADHkEJicT1qjuoEgFyfPIg',
        Constants.IntValue,
        'NwAp_UmGRlWTOCss0Yfwbw'
      );

      const updateIntValueResponse = require('../../../../test/data/api/v2/values/update-int-value-response-expanded.json');

      // TODO: remove this bad hack once test data is stable
      updateIntValueResponse['@id'] = 'http://rdfh.ch/0001/a-thing/values/ADHkEJicT1qjuoEgFyfPIg';
      updateIntValueResponse['http://api.knora.org/ontology/knora-api/v2#valueHasUUID'] = 'NwAp_UmGRlWTOCss0Yfwbw';

      expect(mockedUpdateIntValueResponse).toEqual(updateIntValueResponse);
    });

    it('should update an integer value', done => {
      const updateIntVal = new UpdateIntValue();

      updateIntVal.id = 'http://rdfh.ch/0001/a-thing/values/Gdp7h5fOTEaxJEvoTXIW5A';
      updateIntVal.int = 5;

      const updateResource = new UpdateResource<UpdateValue>();

      updateResource.id = 'http://rdfh.ch/0001/a-thing';
      updateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
      updateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger';
      updateResource.value = updateIntVal;

      ajaxMock.setMockResponse(
        WriteValueMocks.mockUpdateValueResponse(
          'http://rdfh.ch/0001/a-thing/values/updated',
          Constants.IntValue,
          'uuid'
        )
      );

      knoraApiConnection.v2.values.updateValue(updateResource).subscribe((res: WriteValueResponse) => {
        expect(res.id).toEqual('http://rdfh.ch/0001/a-thing/values/updated');
        expect(res.type).toEqual(Constants.IntValue);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/values');

        expect(request?.method).toEqual('PUT');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
        expect(request?.headers?.['X-Asset-Ingested']).toEqual('true');

        const expectedPayload = require('../../../../test/data/api/v2/values/update-int-value-request-expanded.json');

        // TODO: remove this bad hack once test data is stable
        expectedPayload['http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger']['@id'] =
          'http://rdfh.ch/0001/a-thing/values/Gdp7h5fOTEaxJEvoTXIW5A';

        expect(request?.body).toEqual(expectedPayload);

        done();
      });
    });

    it('should update a decimal value', done => {
      const updateDecimalVal = new UpdateDecimalValue();

      updateDecimalVal.id = 'http://rdfh.ch/0001/a-thing/values/7Rl2CDFTSIGE04RyB1CG2w';
      updateDecimalVal.decimal = 5.6;

      const updateResource = new UpdateResource<UpdateValue>();

      updateResource.id = 'http://rdfh.ch/0001/a-thing';
      updateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
      updateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal';
      updateResource.value = updateDecimalVal;

      ajaxMock.setMockResponse(
        WriteValueMocks.mockUpdateValueResponse(
          'http://rdfh.ch/0001/a-thing/values/updated',
          Constants.DecimalValue,
          'uuid'
        )
      );

      knoraApiConnection.v2.values.updateValue(updateResource).subscribe((res: WriteValueResponse) => {
        expect(res.id).toEqual('http://rdfh.ch/0001/a-thing/values/updated');
        expect(res.type).toEqual(Constants.DecimalValue);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/values');

        expect(request?.method).toEqual('PUT');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
        expect(request?.headers?.['X-Asset-Ingested']).toEqual('true');

        const expectedPayload = require('../../../../test/data/api/v2/values/update-decimal-value-request-expanded.json');

        // TODO: remove this bad hack once test data is stable
        expectedPayload['http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal']['@id'] =
          'http://rdfh.ch/0001/a-thing/values/7Rl2CDFTSIGE04RyB1CG2w';

        expect(request?.body).toEqual(expectedPayload);

        done();
      });
    });

    it('should create an integer value', done => {
      const createIntVal = new CreateIntValue();
      createIntVal.int = 4;

      const updateResource = new UpdateResource<CreateValue>();

      updateResource.id = 'http://rdfh.ch/0001/a-thing';
      updateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
      updateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger';
      updateResource.value = createIntVal;

      ajaxMock.setMockResponse(
        WriteValueMocks.mockCreateValueResponse(
          'http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/created',
          Constants.IntValue,
          'uuid',
          '2019-01-09T15:45:54.502951Z'
        )
      );

      knoraApiConnection.v2.values.createValue(updateResource).subscribe((res: WriteValueResponse) => {
        expect(res.id).toEqual('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/created');
        expect(res.type).toEqual(Constants.IntValue);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/values');

        expect(request?.method).toEqual('POST');

        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
        expect(request?.headers?.['X-Asset-Ingested']).toEqual('true');

        const expectedPayload = require('../../../../test/data/api/v2/values/create-int-value-request-expanded.json');

        expect(request?.body).toEqual(expectedPayload);

        done();
      });
    });

    it('should attempt to create a still image file value', () => {
      const createStillImageFileVal = new CreateStillImageFileValue();

      expect(createStillImageFileVal.type).toEqual('http://api.knora.org/ontology/knora-api/v2#StillImageFileValue');

      createStillImageFileVal.filename = 'IQUO3t1AABm-FSLC0vNvVpr.jp2';

      const updateResource = new UpdateResource<CreateValue>();

      updateResource.id = 'http://rdfh.ch/0001/a-thing-picture';
      updateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#ThingPicture';
      updateResource.property = 'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue';
      updateResource.value = createStillImageFileVal;

      expect(() => {
        knoraApiConnection.v2.values.createValue(updateResource);
      }).toThrow(new Error('A value of type CreateFileValue can only be created with a new resource'));
    });

    it('should attempt to create a still image vector file value', () => {
      const createStillImageVectorFileVal = new CreateStillImageVectorFileValue();

      expect(createStillImageVectorFileVal.type).toEqual(
        'http://api.knora.org/ontology/knora-api/v2#StillImageVectorFileValue'
      );

      createStillImageVectorFileVal.filename = 'test-vector.svg';

      const updateResource = new UpdateResource<CreateValue>();

      updateResource.id = 'http://rdfh.ch/0001/a-thing-vector';
      updateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#ThingPicture';
      updateResource.property = 'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue';
      updateResource.value = createStillImageVectorFileVal;

      expect(() => {
        knoraApiConnection.v2.values.createValue(updateResource);
      }).toThrow(new Error('A value of type CreateFileValue can only be created with a new resource'));
    });
  });

  describe('Method deleteValue', () => {
    it('should delete a value with a comment', done => {
      const deleteVal = new DeleteValue();

      deleteVal.id = 'http://rdfh.ch/0001/a-thing/values/OvVdty6hTg2uSYE6Mukhnw';
      deleteVal.type = 'http://api.knora.org/ontology/knora-api/v2#IntValue';
      deleteVal.deleteComment = 'this value was incorrect';

      const updateResource = new UpdateResource<DeleteValue>();

      updateResource.id = 'http://rdfh.ch/0001/a-thing';
      updateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
      updateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger';

      updateResource.value = deleteVal;

      ajaxMock.setMockResponse({
        'knora-api:result': 'Value <http://rdfh.ch/0001/a-thing/values/OvVdty6hTg2uSYE6Mukhnw> marked as deleted',
        '@context': {
          'knora-api': 'http://api.knora.org/ontology/knora-api/v2#',
        },
      });

      knoraApiConnection.v2.values.deleteValue(updateResource).subscribe((res: DeleteValueResponse) => {
        expect(res.result).toEqual(
          'Value <http://rdfh.ch/0001/a-thing/values/OvVdty6hTg2uSYE6Mukhnw> marked as deleted'
        );

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/values/delete');

        expect(request?.method).toEqual('POST');

        const expectedPayload = require('../../../../test/data/api/v2/values/delete-int-value-request-expanded.json');

        // TODO: remove this bad hack once test data is stable
        expectedPayload['http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger']['@id'] =
          'http://rdfh.ch/0001/a-thing/values/OvVdty6hTg2uSYE6Mukhnw';

        expect(request?.body).toEqual(expectedPayload);

        done();
      });
    });

    it('should delete a value without a comment', done => {
      const deleteVal = new DeleteValue();

      deleteVal.id = 'http://rdfh.ch/0001/a-thing/values/SR199iTcT5GMbUig36YwOA';
      deleteVal.type = 'http://api.knora.org/ontology/knora-api/v2#LinkValue';

      const updateResource = new UpdateResource<DeleteValue>();

      updateResource.id = 'http://rdfh.ch/0001/a-thing';
      updateResource.type = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
      updateResource.property = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue';

      updateResource.value = deleteVal;

      ajaxMock.setMockResponse({
        'knora-api:result': 'Value <http://rdfh.ch/0001/a-thing/values/SR199iTcT5GMbUig36YwOA> marked as deleted',
        '@context': {
          'knora-api': 'http://api.knora.org/ontology/knora-api/v2#',
        },
      });

      knoraApiConnection.v2.values.deleteValue(updateResource).subscribe((res: DeleteValueResponse) => {
        expect(res.result).toEqual(
          'Value <http://rdfh.ch/0001/a-thing/values/SR199iTcT5GMbUig36YwOA> marked as deleted'
        );

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toBe('http://0.0.0.0:3333/v2/values/delete');

        expect(request?.method).toEqual('POST');

        const expectedPayload = require('../../../../test/data/api/v2/values/delete-link-value-request-expanded.json');

        // TODO: remove this bad hack once test data is stable
        expectedPayload['http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue']['@id'] =
          'http://rdfh.ch/0001/a-thing/values/SR199iTcT5GMbUig36YwOA';

        expect(request?.body).toEqual(expectedPayload);

        done();
      });
    });
  });
});
