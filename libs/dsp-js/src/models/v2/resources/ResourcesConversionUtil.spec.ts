import { JsonConvert, OperationMode, ValueCheckingMode } from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';
import { of } from 'rxjs';
import { MockList } from '../../../../test/data/api/v2/mock-list';
import { MockOntology } from '../../../../test/data/api/v2/mock-ontology';
import { MockOntologyAssertions } from '../../../../test/data/api/v2/mock-ontology-assertions';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { ReadResource } from './read/read-resource';
import { ReadResourceSequence } from './read/read-resource-sequence';
import { ResourcesConversionUtil } from './ResourcesConversionUtil';
import { ReadBooleanValue } from './values/read/read-boolean-value';
import { ReadColorValue } from './values/read/read-color-value';
import { KnoraDate, Precision, ReadDateValue } from './values/read/read-date-value';
import { ReadDecimalValue } from './values/read/read-decimal-value';
import { ReadStillImageFileValue, ReadStillImageVectorFileValue } from './values/read/read-file-value';
import { Point2D, ReadGeomValue } from './values/read/read-geom-value';
import { ReadIntValue } from './values/read/read-int-value';
import { ReadIntervalValue } from './values/read/read-interval-value';
import { ReadLinkValue } from './values/read/read-link-value';
import { ReadListValue } from './values/read/read-list-value';
import { ReadTextValueAsString, ReadTextValueAsXml } from './values/read/read-text-value';
import { ReadTimeValue } from './values/read/read-time-value';
import { ReadUriValue } from './values/read/read-uri-value';

describe('ResourcesConversionUtil', () => {
  const config = new KnoraApiConfig('http', '0.0.0.0', 3333, undefined, '', true);
  let knoraApiConnection: KnoraApiConnection;

  let getResourceClassDefinitionFromCacheSpy: jest.SpyInstance;
  let getListNodeFromCacheSpy: jest.SpyInstance;

  const jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  beforeEach(() => {
    knoraApiConnection = new KnoraApiConnection(config);

    getResourceClassDefinitionFromCacheSpy = jest
      .spyOn(knoraApiConnection.v2.ontologyCache, 'getResourceClassDefinition')
      .mockImplementation((resClassIri: string) => {
        const mock = MockOntology.mockIResourceClassAndPropertyDefinitions(resClassIri);
        return of(mock);
      });

    getListNodeFromCacheSpy = jest
      .spyOn(knoraApiConnection.v2.listNodeCache, 'getNode')
      .mockImplementation((listNodeIri: string) => {
        return of(MockList.mockNode(listNodeIri));
      });
  });

  afterEach(() => {
    getResourceClassDefinitionFromCacheSpy.mockRestore();
    getListNodeFromCacheSpy.mockRestore();
  });

  describe('Method parseResourceSequence()', () => {
    it('parse JSON-LD representing a single resource', done => {
      const resource = require('../../../../test/data/api/v2/resources/testding-expanded.json');

      ResourcesConversionUtil.createReadResourceSequence(
        resource,
        knoraApiConnection.v2.ontologyCache,
        knoraApiConnection.v2.listNodeCache,
        jsonConvert
      ).subscribe((resSeq: ReadResourceSequence) => {
        expect(resSeq.resources.length).toEqual(1);

        // make sure that mocked ontology cache works as expected
        expect(
          resSeq.resources[0].entityInfo.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'].propertiesList
            .length
        ).toEqual(MockOntologyAssertions.propertyIndexesAnythingThing.length);
        expect(
          resSeq.resources[0].entityInfo.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'].propertiesList
            .map(prop => prop.propertyIndex)
            .sort()
        ).toEqual(MockOntologyAssertions.propertyIndexesAnythingThing.sort());
        expect(Object.keys(resSeq.resources[0].entityInfo.properties).length).toEqual(
          MockOntologyAssertions.propertyIndexesAnythingThing.length
        );
        expect(Object.keys(resSeq.resources[0].entityInfo.properties).sort()).toEqual(
          MockOntologyAssertions.propertyIndexesAnythingThing.sort()
        );

        expect(resSeq.resources[0].id).toEqual('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw');
        expect(resSeq.resources[0].type).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');
        expect(resSeq.resources[0].label).toEqual('testding');

        expect(resSeq.resources[0].attachedToProject).toEqual('http://rdfh.ch/projects/0001');
        expect(resSeq.resources[0].attachedToUser).toEqual('http://rdfh.ch/users/BhkfBc3hTeS_IDo-JgXRbQ');
        expect(resSeq.resources[0].hasPermissions).toEqual(
          'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser'
        );
        expect(resSeq.resources[0].userHasPermission).toEqual('RV');
        expect(resSeq.resources[0].arkUrl).toEqual('http://0.0.0.0:3336/ark:/72163/1/0001/H6gBWUuJSuuO=CilHV8kQwk');
        expect(resSeq.resources[0].versionArkUrl).toEqual(
          'http://0.0.0.0:3336/ark:/72163/1/0001/H6gBWUuJSuuO=CilHV8kQwk.20180528T155203897Z'
        );
        expect(resSeq.resources[0].creationDate).toEqual('2018-05-28T15:52:03.897Z');
        expect(resSeq.resources[0].lastModificationDate).toBeUndefined();

        expect(resSeq.resources[0].resourceClassLabel).toEqual('Thing');
        expect(resSeq.resources[0].resourceClassComment).toEqual(
          "'The whole world is full of things, which means there's a real need for someone to go searching for them. And that's exactly what a thing-searcher does.' --Pippi Longstocking"
        );

        expect(resSeq.resources[0].getNumberOfProperties()).toEqual(15);
        expect(resSeq.resources[0].getNumberOfValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri')).toEqual(
          1
        );

        //
        // test boolean value
        //
        const boolVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean');
        expect(boolVals.length).toEqual(1);
        expect(boolVals[0].id).toEqual('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/IN4R19yYR0ygi3K2VEHpUQ');
        expect(boolVals[0].attachedToUser).toEqual('http://rdfh.ch/users/BhkfBc3hTeS_IDo-JgXRbQ');
        expect(boolVals[0].arkUrl).toEqual(
          'http://0.0.0.0:3336/ark:/72163/1/0001/H6gBWUuJSuuO=CilHV8kQwk/IN4R19yYR0ygi3K2VEHpUQe'
        );
        expect(boolVals[0].versionArkUrl).toEqual(
          'http://0.0.0.0:3336/ark:/72163/1/0001/H6gBWUuJSuuO=CilHV8kQwk/IN4R19yYR0ygi3K2VEHpUQe.20180528T155203897Z'
        );
        expect(boolVals[0].hasPermissions).toEqual(
          'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser'
        );
        expect(boolVals[0].userHasPermission).toEqual('RV');
        expect(boolVals[0].valueCreationDate).toEqual('2018-05-28T15:52:03.897Z');
        expect(boolVals[0].userHasPermission).toEqual('RV');
        expect(boolVals[0].uuid).toEqual('IN4R19yYR0ygi3K2VEHpUQ');
        expect(boolVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#BooleanValue');
        expect(boolVals[0].strval).toEqual('TRUE');
        const boolValsTyped: ReadBooleanValue[] = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean',
          ReadBooleanValue
        );
        expect(boolValsTyped[0].bool).toBeTruthy();

        //
        // test color value
        //
        const colorVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor');
        expect(colorVals.length).toEqual(1);
        expect(colorVals[0].id).toEqual('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/TAziKNP8QxuyhC4Qf9-b6w');
        expect(colorVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#ColorValue');
        expect(colorVals[0].strval).toEqual('#ff3333');
        const colorValsTyped: ReadColorValue[] = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor',
          ReadColorValue
        );
        expect(colorValsTyped[0].color).toEqual('#ff3333');

        //
        // test decimal value
        //
        const decimalVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal');
        expect(decimalVals.length).toEqual(1);
        expect(decimalVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#DecimalValue');
        expect(decimalVals[0].strval).toEqual('1.5');
        const decimalValsTyped: ReadDecimalValue[] = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal',
          ReadDecimalValue
        );
        expect(decimalValsTyped[0].decimal).toBeCloseTo(1.5, 1);

        //
        // test integer value
        //
        const integerVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger');
        expect(integerVals.length).toEqual(1);
        expect(integerVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#IntValue');
        expect(integerVals[0].strval).toEqual('1');
        const integerValsTyped: ReadIntValue[] = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger',
          ReadIntValue
        );
        expect(integerValsTyped[0].int).toEqual(1);

        //
        // test interval value
        //
        const intervalVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval');
        expect(intervalVals.length).toEqual(1);
        expect(intervalVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#IntervalValue');
        expect(intervalVals[0].strval).toEqual('0 - 216000');
        const intervalValsTyped: ReadIntervalValue[] = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval',
          ReadIntervalValue
        );
        expect(intervalValsTyped[0].start).toBeGreaterThanOrEqual(0);
        expect(intervalValsTyped[0].start).toBeLessThanOrEqual(0);
        expect(intervalValsTyped[0].end).toBeGreaterThanOrEqual(216000);
        expect(intervalValsTyped[0].end).toBeLessThanOrEqual(216000);

        //
        // test link value
        //
        const linkVals = resSeq.resources[0].getValues(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue'
        );
        expect(linkVals.length).toEqual(1);
        expect(linkVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#LinkValue');
        expect(linkVals[0].strval).toEqual('Sierra');
        const linkValsTyped: ReadLinkValue[] = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue',
          ReadLinkValue
        );
        expect(linkValsTyped[0].linkedResourceIri).toEqual('http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ');
        expect(linkValsTyped[0].linkedResource).toBeDefined();
        expect(linkValsTyped[0].linkedResource instanceof ReadResource).toBeTruthy();
        if (linkValsTyped[0].linkedResource) {
          const linkedTarget: ReadResource = linkValsTyped[0].linkedResource;
          expect(linkedTarget.id).toEqual('http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ');
          expect(linkedTarget.type).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');
          expect(linkedTarget.label).toEqual('Sierra');
        }

        // determine the link property from the link value property
        expect(
          resSeq.resources[0].getLinkPropertyIriFromLinkValuePropertyIri(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue'
          )
        ).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing');

        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(2);
        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        //
        // test richtext value
        //
        const rtextVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext');
        expect(rtextVals.length).toEqual(1);
        expect(rtextVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#TextValue');
        expect(rtextVals[0].strval).toEqual(
          '<?xml version="1.0" encoding="UTF-8"?>\n<text><p>test with <strong>markup</strong></p></text>'
        );
        expect(rtextVals[0] instanceof ReadTextValueAsXml).toBeTruthy();
        if (rtextVals[0] instanceof ReadTextValueAsXml) {
          const rtextValsTyped: ReadTextValueAsXml[] = resSeq.resources[0].getValuesAs(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext',
            ReadTextValueAsXml
          );
          expect(rtextValsTyped[0].xml).toEqual(
            '<?xml version="1.0" encoding="UTF-8"?>\n<text><p>test with <strong>markup</strong></p></text>'
          );
          expect(rtextValsTyped[0].mapping).toEqual('http://rdfh.ch/standoff/mappings/StandardMapping');
        }

        //
        // test text value
        //
        const textVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasText');
        expect(textVals.length).toEqual(1);
        expect(textVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#TextValue');
        expect(textVals[0].strval).toEqual('test');
        expect(textVals[0] instanceof ReadTextValueAsString).toBeTruthy();
        if (textVals[0] instanceof ReadTextValueAsString) {
          const textValsTyped: ReadTextValueAsString[] = resSeq.resources[0].getValuesAs(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText',
            ReadTextValueAsString
          );
          expect(textValsTyped[0].text).toEqual('test');
        }

        //
        // test uri value
        //
        const uriVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri');

        expect(uriVals.length).toEqual(1);

        expect(uriVals[0].id).toEqual('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/uBAmWuRhR-eo1u1eP7qqNg');
        expect(uriVals[0].strval).toEqual('http://www.google.ch');
        expect(uriVals[0].type).toEqual('http://api.knora.org/ontology/knora-api/v2#UriValue');
        expect(uriVals[0].attachedToUser).toEqual('http://rdfh.ch/users/BhkfBc3hTeS_IDo-JgXRbQ');
        expect(uriVals[0].arkUrl).toEqual(
          'http://0.0.0.0:3336/ark:/72163/1/0001/H6gBWUuJSuuO=CilHV8kQwk/uBAmWuRhR=eo1u1eP7qqNgs'
        );
        expect(uriVals[0].versionArkUrl).toEqual(
          'http://0.0.0.0:3336/ark:/72163/1/0001/H6gBWUuJSuuO=CilHV8kQwk/uBAmWuRhR=eo1u1eP7qqNgs.20180528T155203897Z'
        );
        expect(uriVals[0].hasPermissions).toEqual(
          'CR knora-admin:Creator|M knora-admin:ProjectMember|V knora-admin:KnownUser|RV knora-admin:UnknownUser'
        );
        expect(uriVals[0].userHasPermission).toEqual('RV');
        expect(uriVals[0].valueCreationDate).toEqual('2018-05-28T15:52:03.897Z');
        expect(uriVals[0].userHasPermission).toEqual('RV');
        expect(uriVals[0].uuid).toEqual('uBAmWuRhR-eo1u1eP7qqNg');

        expect(uriVals[0] instanceof ReadUriValue).toBeTruthy();
        expect((uriVals[0] as ReadUriValue).uri).toEqual('http://www.google.ch');

        const uriValsTyped: ReadUriValue[] = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri',
          ReadUriValue
        );
        expect(uriValsTyped[0].uri).toEqual('http://www.google.ch');

        expect(resSeq.resources[0].getValueType('http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri')).toEqual(
          'http://api.knora.org/ontology/knora-api/v2#UriValue'
        );

        // test list value
        const listVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem');

        expect(listVals[0].strval).toEqual('Tree list node 01');
        expect(listVals[0] instanceof ReadListValue);
        expect((listVals[0] as ReadListValue).listNode).toEqual('http://rdfh.ch/lists/0001/treeList01');
        expect((listVals[0] as ReadListValue).listNodeLabel).toEqual('Tree list node 01');

        expect(getListNodeFromCacheSpy).toHaveBeenCalledTimes(2);
        expect(getListNodeFromCacheSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/treeList01');
        expect(getListNodeFromCacheSpy).toHaveBeenCalledWith('http://rdfh.ch/lists/0001/otherTreeList01');

        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(2);
        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        expect(resSeq.resources[0].outgoingReferences.length).toEqual(1);
        expect(resSeq.resources[0].outgoingReferences[0].id).toEqual('http://rdfh.ch/0001/0C-0L1kORryKzJAJxxRyRQ');

        //
        // test date value
        //
        const dateVals = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate');
        expect(dateVals.length).toEqual(1);
        expect(dateVals[0].id).toEqual('http://rdfh.ch/0001/H6gBWUuJSuuO-CilHV8kQw/values/-rG4F5FTTu2iB5mTBPVn5Q');
        expect(dateVals[0].strval).toEqual('GREGORIAN:2018-05-13 CE');
        expect(dateVals[0] instanceof ReadDateValue).toBeTruthy();
        const dateValsTyped: ReadDateValue[] = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate',
          ReadDateValue
        );
        expect(dateValsTyped[0].date instanceof KnoraDate).toBeTruthy();
        const dateValsDate = dateValsTyped[0].date as KnoraDate;
        expect(dateValsDate.calendar).toEqual('GREGORIAN');
        expect(dateValsDate.precision).toEqual(Precision.dayPrecision);
        expect(dateValsDate.era).toEqual('CE');
        expect(dateValsDate.year).toEqual(2018);
        expect(dateValsDate.month).toEqual(5);
        expect(dateValsDate.day).toEqual(13);

        //
        // test geometry value
        //
        expect(
          resSeq.resources[0].getNumberOfValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeometry')
        ).toEqual(1);
        const geomValue = resSeq.resources[0].getValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeometry')[0];

        expect(geomValue instanceof ReadGeomValue).toBeTruthy();
        expect((geomValue as ReadGeomValue).geometry.type).toEqual('rectangle');
        expect((geomValue as ReadGeomValue).geometry.lineWidth).toEqual(2);
        expect((geomValue as ReadGeomValue).geometry.lineColor).toEqual('#ff3333');
        expect((geomValue as ReadGeomValue).geometry.points.length).toEqual(2);
        expect((geomValue as ReadGeomValue).geometry.points[0]).toEqual(
          new Point2D(0.08098591549295775, 0.16741071428571427)
        );
        expect((geomValue as ReadGeomValue).geometry.points[1]).toEqual(
          new Point2D(0.7394366197183099, 0.7299107142857143)
        );

        //
        // test time value
        //
        expect(
          resSeq.resources[0].getNumberOfValues('http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp')
        ).toEqual(1);
        const timeValue = resSeq.resources[0].getValues(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp'
        )[0];

        expect(timeValue instanceof ReadTimeValue).toBeTruthy();
        expect((timeValue as ReadTimeValue).time).toEqual('2019-08-30T10:45:20.173572Z');
        expect((timeValue as ReadTimeValue).strval).toEqual('2019-08-30T10:45:20.173572Z');

        const timeValueTyped = resSeq.resources[0].getValuesAs(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp',
          ReadTimeValue
        )[0];
        expect(timeValueTyped instanceof ReadTimeValue).toBeTruthy();
        expect(timeValueTyped.time).toEqual('2019-08-30T10:45:20.173572Z');

        done();
      });
    });

    it('attempt to determine a link property IRI from a non link value property IRI', done => {
      const resource = require('../../../../test/data/api/v2/resources/testding-expanded.json');

      ResourcesConversionUtil.createReadResourceSequence(
        resource,
        knoraApiConnection.v2.ontologyCache,
        knoraApiConnection.v2.listNodeCache,
        jsonConvert
      ).subscribe(resSeq => {
        expect(() => {
          resSeq.resources[0].getLinkPropertyIriFromLinkValuePropertyIri(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing'
          );
        }).toThrow(
          new Error(
            'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing is not a valid link value property IRI'
          )
        );

        done();
      });
    });

    it('parse JSON-lD representing a resource with a StillImageRepresentation', done => {
      const resource = require('../../../../test/data/api/v2/values/get-still-image-file-value-response-expanded.json');

      ResourcesConversionUtil.createReadResourceSequence(
        resource,
        knoraApiConnection.v2.ontologyCache,
        knoraApiConnection.v2.listNodeCache,
        jsonConvert
      ).subscribe((res: ReadResourceSequence) => {
        expect(res.resources.length).toEqual(1);

        expect(
          res.resources[0].getNumberOfValues('http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue')
        ).toEqual(1);
        const stillImageFileValue = res.resources[0].getValues(
          'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue'
        )[0];

        expect(stillImageFileValue instanceof ReadStillImageFileValue).toBeTruthy();

        expect((stillImageFileValue as ReadStillImageFileValue).dimX).toEqual(512);
        expect((stillImageFileValue as ReadStillImageFileValue).dimY).toEqual(256);
        expect((stillImageFileValue as ReadStillImageFileValue).iiifBaseUrl).toEqual('http://0.0.0.0:1024/0001');
        expect((stillImageFileValue as ReadStillImageFileValue).filename).toEqual('B1D0OkEgfFp-Cew2Seur7Wi.jp2');
        expect((stillImageFileValue as ReadStillImageFileValue).fileUrl).toEqual(
          'http://0.0.0.0:1024/0001/B1D0OkEgfFp-Cew2Seur7Wi.jp2/full/512,256/0/default.jpg'
        );

        done();
      });
    });

    it('parse JSON-LD representing a resource with a StillImageVectorFileValue', done => {
      const resource = require('../../../../test/data/api/v2/manually-generated/get-still-image-vector-file-value-response-expanded.json');

      ResourcesConversionUtil.createReadResourceSequence(
        resource,
        knoraApiConnection.v2.ontologyCache,
        knoraApiConnection.v2.listNodeCache,
        jsonConvert
      ).subscribe((res: ReadResourceSequence) => {
        expect(res.resources.length).toEqual(1);

        expect(
          res.resources[0].getNumberOfValues('http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue')
        ).toEqual(1);
        const stillImageVectorFileValue = res.resources[0].getValues(
          'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue'
        )[0];

        expect(stillImageVectorFileValue instanceof ReadStillImageVectorFileValue).toBeTruthy();

        expect((stillImageVectorFileValue as ReadStillImageVectorFileValue).filename).toEqual('test-vector.svg');
        expect((stillImageVectorFileValue as ReadStillImageVectorFileValue).fileUrl).toEqual(
          'http://0.0.0.0:1024/0001/test-vector.svg'
        );
        expect(stillImageVectorFileValue.strval).toEqual('http://0.0.0.0:1024/0001/test-vector.svg');

        done();
      });
    });

    it('parse JSON-LD representing an empty resource', done => {
      const emptyResource = {};

      ResourcesConversionUtil.createReadResourceSequence(
        emptyResource,
        knoraApiConnection.v2.ontologyCache,
        knoraApiConnection.v2.listNodeCache,
        jsonConvert
      ).subscribe(resSeq => {
        expect(resSeq.resources.length).toEqual(0);
        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(0);

        done();
      });
    });

    it('parse JSON-LD representing several resources', done => {
      const resource = require('../../../../test/data/api/v2/resources/things-expanded.json');

      ResourcesConversionUtil.createReadResourceSequence(
        resource,
        knoraApiConnection.v2.ontologyCache,
        knoraApiConnection.v2.listNodeCache,
        jsonConvert
      ).subscribe(resSeq => {
        expect(resSeq.resources.length).toEqual(2);
        expect(resSeq.mayHaveMoreResults).toEqual(false);

        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(2);
        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        done();
      });
    });

    it('parse JSON-LD representing several resources with paging information', done => {
      const resource = require('../../../../test/data/api/v2/resources/things-with-paging-expanded.json');

      ResourcesConversionUtil.createReadResourceSequence(
        resource,
        knoraApiConnection.v2.ontologyCache,
        knoraApiConnection.v2.listNodeCache,
        jsonConvert
      ).subscribe((resSeq: ReadResourceSequence) => {
        expect(resSeq.resources.length).toEqual(24);
        expect(resSeq.mayHaveMoreResults).toEqual(true);

        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledTimes(24);
        expect(getResourceClassDefinitionFromCacheSpy).toHaveBeenCalledWith(
          'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'
        );

        done();
      });
    });
  });
});
