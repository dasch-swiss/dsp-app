import { of, throwError } from 'rxjs';
import { AjaxError } from 'rxjs/ajax';
import { delay } from 'rxjs';
import { MockOntology } from '../../../test/data/api/v2/mock-ontology';
import { MockOntologyAssertions } from '../../../test/data/api/v2/mock-ontology-assertions';
import { KnoraApiConfig } from '../../knora-api-config';
import { KnoraApiConnection } from '../../knora-api-connection';
import { ApiResponseError } from '../../models/api-response-error';
import { PropertyDefinition } from '../../models/v2/ontologies/property-definition';
import { ReadOntology } from '../../models/v2/ontologies/read/read-ontology';
import { ResourcePropertyDefinition } from '../../models/v2/ontologies/resource-property-definition';
import { SystemPropertyDefinition } from '../../models/v2/ontologies/system-property-definition';
import {
  IHasPropertyWithPropertyDefinition,
  ResourceClassDefinitionWithPropertyDefinition,
} from './resource-class-definition-with-property-definition';

describe('OntologyCache', () => {
  describe('successful HTTP request', () => {
    const config = new KnoraApiConfig('http', '0.0.0.0', 3333, '', '', true);
    let knoraApiConnection: KnoraApiConnection;

    let getOntoSpy: jest.SpyInstance;

    beforeEach(() => {
      knoraApiConnection = new KnoraApiConnection(config);

      getOntoSpy = jest.spyOn(knoraApiConnection.v2.onto, 'getOntology').mockImplementation((ontoIri: string) => {
        const onto = MockOntology.mockReadOntology(ontoIri);

        // use delay operator to make a sync Observable async
        return of(onto).pipe(delay(1));
      });
    });

    afterEach(() => {
      getOntoSpy.mockRestore();
    });

    describe('Method getItem()', () => {
      it('should get an ontology with dependencies from the cache', done => {
        knoraApiConnection.v2.ontologyCache['getItem']('http://0.0.0.0:3333/ontology/0001/anything/v2').subscribe(
          (onto: ReadOntology) => {
            expect(onto.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');

            expect(getOntoSpy).toHaveBeenCalledTimes(2);
            expect(getOntoSpy).toHaveBeenCalledWith('http://0.0.0.0:3333/ontology/0001/anything/v2');
            expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2'); // anything onto depends on knora-api

            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://0.0.0.0:3333/ontology/0001/anything/v2']
            ).not.toBeUndefined();
            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://api.knora.org/ontology/knora-api/v2']
            ).not.toBeUndefined(); // anything onto depends on knora-api
            done();
          }
        );
      });

      it('should get an ontology with dependencies from the cache several times asynchronously', done => {
        knoraApiConnection.v2.ontologyCache['getItem']('http://0.0.0.0:3333/ontology/0001/anything/v2').subscribe(
          (onto: ReadOntology) => {
            expect(onto.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');

            expect(getOntoSpy).toHaveBeenCalledTimes(2);
            expect(getOntoSpy).toHaveBeenCalledWith('http://0.0.0.0:3333/ontology/0001/anything/v2');
            expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2'); // anything onto depends on knora-api

            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://0.0.0.0:3333/ontology/0001/anything/v2']
            ).not.toBeUndefined();
            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://api.knora.org/ontology/knora-api/v2']
            ).not.toBeUndefined(); // anything onto depends on knora-api
          }
        );

        knoraApiConnection.v2.ontologyCache['getItem']('http://0.0.0.0:3333/ontology/0001/anything/v2').subscribe(
          (onto: ReadOntology) => {
            expect(onto.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');

            expect(getOntoSpy).toHaveBeenCalledTimes(2);
            expect(getOntoSpy).toHaveBeenCalledWith('http://0.0.0.0:3333/ontology/0001/anything/v2');
            expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2'); // anything onto depends on knora-api

            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://0.0.0.0:3333/ontology/0001/anything/v2']
            ).not.toBeUndefined();
            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://api.knora.org/ontology/knora-api/v2']
            ).not.toBeUndefined(); // anything onto depends on knora-api
          }
        );

        knoraApiConnection.v2.ontologyCache['getItem']('http://0.0.0.0:3333/ontology/0001/anything/v2').subscribe(
          (onto: ReadOntology) => {
            expect(onto.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');

            expect(getOntoSpy).toHaveBeenCalledTimes(2);
            expect(getOntoSpy).toHaveBeenCalledWith('http://0.0.0.0:3333/ontology/0001/anything/v2');
            expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2'); // anything onto depends on knora-api

            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://0.0.0.0:3333/ontology/0001/anything/v2']
            ).not.toBeUndefined();
            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://api.knora.org/ontology/knora-api/v2']
            ).not.toBeUndefined(); // anything onto depends on knora-api
            done();
          }
        );
      });

      it('should get an ontology without dependencies from the cache', done => {
        knoraApiConnection.v2.ontologyCache['getItem']('http://api.knora.org/ontology/knora-api/v2').subscribe(
          (onto: ReadOntology) => {
            expect(onto.id).toEqual('http://api.knora.org/ontology/knora-api/v2');

            expect(getOntoSpy).toHaveBeenCalledTimes(1);
            expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2');

            expect(
              knoraApiConnection.v2.ontologyCache['cache']['http://api.knora.org/ontology/knora-api/v2']
            ).not.toBeUndefined();
            done();
          }
        );
      });
    });

    describe('Method getOntology()', () => {
      it('should get an ontology with direct dependencies from the cache', done => {
        knoraApiConnection.v2.ontologyCache
          .getOntology('http://0.0.0.0:3333/ontology/0001/anything/v2')
          .subscribe(ontos => {
            expect(ontos.size).toEqual(2);
            expect(ontos.has('http://0.0.0.0:3333/ontology/0001/anything/v2')).toBeTruthy();
            expect(ontos.has('http://api.knora.org/ontology/knora-api/v2')).toBeTruthy();

            expect(ontos.get('http://0.0.0.0:3333/ontology/0001/anything/v2') instanceof ReadOntology).toBeTruthy();
            expect(ontos.get('http://api.knora.org/ontology/knora-api/v2') instanceof ReadOntology).toBeTruthy();

            expect(getOntoSpy).toHaveBeenCalledTimes(2);
            expect(getOntoSpy).toHaveBeenCalledWith('http://0.0.0.0:3333/ontology/0001/anything/v2');
            expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2'); // anything onto depends on knora-api

            done();
          });

        // the Observable is returned synchronously from the cache
        expect(
          knoraApiConnection.v2.ontologyCache['cache']['http://0.0.0.0:3333/ontology/0001/anything/v2']
        ).toBeDefined();
      });

      it('should get an ontology without dependencies from the cache', done => {
        knoraApiConnection.v2.ontologyCache
          .getOntology('http://api.knora.org/ontology/knora-api/v2')
          .subscribe(ontos => {
            expect(ontos.size).toEqual(1);
            expect(ontos.has('http://api.knora.org/ontology/knora-api/v2')).toBeTruthy();

            expect(ontos.get('http://api.knora.org/ontology/knora-api/v2') instanceof ReadOntology).toBeTruthy();

            expect(getOntoSpy).toHaveBeenCalledTimes(1);
            expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2');

            done();
          });
      });
    });

    describe('Method getResourceClass()', () => {
      it('should get the definition of a resource class and its properties', done => {
        knoraApiConnection.v2.ontologyCache
          .getResourceClassDefinition('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing')
          .subscribe(resClassDef => {
            expect(
              resClassDef.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'] instanceof
                ResourceClassDefinitionWithPropertyDefinition
            ).toBeTruthy();
            const thingDef: ResourceClassDefinitionWithPropertyDefinition =
              resClassDef.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'];
            expect(thingDef.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing');

            expect(
              resClassDef.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'].propertiesList.length
            ).toEqual(38);
            expect(
              resClassDef.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'].propertiesList
                .map(prop => prop.propertyIndex)
                .sort()
            ).toEqual(MockOntologyAssertions.propertyIndexesAnythingThing.sort());
            expect(
              resClassDef.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'].propertiesList.length
            ).toEqual(MockOntologyAssertions.propertyIndexesAnythingThing.length);

            expect(Object.keys(resClassDef.properties).length).toEqual(38);
            expect(Object.keys(resClassDef.properties).sort()).toEqual(
              MockOntologyAssertions.propertyIndexesAnythingThing.sort()
            );
            expect(Object.keys(resClassDef.properties).length).toEqual(
              MockOntologyAssertions.propertyIndexesAnythingThing.length
            );

            done();
          });
      });

      it('get all property definitions as an array', done => {
        knoraApiConnection.v2.ontologyCache
          .getResourceClassDefinition('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing')
          .subscribe(resClassDef => {
            const props: PropertyDefinition[] = resClassDef.getAllPropertyDefinitions();

            expect(props.length).toEqual(38);
            expect(props.length).toEqual(MockOntologyAssertions.propertyIndexesAnythingThing.length);
            expect(props.map(prop => prop.id).sort()).toEqual(
              MockOntologyAssertions.propertyIndexesAnythingThing.sort()
            );
            expect(props[0] instanceof PropertyDefinition).toBe(true);

            done();
          });
      });

      it('get property definitions as an array filtered by type', done => {
        knoraApiConnection.v2.ontologyCache
          .getResourceClassDefinition('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing')
          .subscribe(resClassDef => {
            const systemProps: SystemPropertyDefinition[] =
              resClassDef.getPropertyDefinitionsByType(SystemPropertyDefinition);

            expect(systemProps.length).toEqual(13);
            expect(systemProps.length).toEqual(MockOntologyAssertions.systemPropertyIndexesAnythingThing.length);
            expect(systemProps.map(prop => prop.id).sort()).toEqual(
              MockOntologyAssertions.systemPropertyIndexesAnythingThing.sort()
            );
            expect(systemProps[0] instanceof SystemPropertyDefinition).toBe(true);

            const resourceProps: ResourcePropertyDefinition[] =
              resClassDef.getPropertyDefinitionsByType(ResourcePropertyDefinition);
            expect(resourceProps.length).toEqual(25);
            expect(resourceProps.length).toEqual(MockOntologyAssertions.resourcePropertyIndexesAnythingThing.length);
            expect(resourceProps.map(prop => prop.id).sort()).toEqual(
              MockOntologyAssertions.resourcePropertyIndexesAnythingThing.sort()
            );
            expect(resourceProps[0] instanceof ResourcePropertyDefinition).toBe(true);

            done();
          });
      });

      it('get property list filtered by type', done => {
        knoraApiConnection.v2.ontologyCache
          .getResourceClassDefinition('http://0.0.0.0:3333/ontology/0001/anything/v2#Thing')
          .subscribe(resClassDef => {
            const systemPropList: IHasPropertyWithPropertyDefinition[] =
              resClassDef.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'].getSystemPropertiesList();
            expect(systemPropList.length).toEqual(13);
            expect(systemPropList.length).toEqual(MockOntologyAssertions.systemPropertyIndexesAnythingThing.length);
            expect(systemPropList.map(prop => prop.propertyIndex).sort()).toEqual(
              MockOntologyAssertions.systemPropertyIndexesAnythingThing.sort()
            );

            const resourcePropList: IHasPropertyWithPropertyDefinition[] =
              resClassDef.classes['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'].getResourcePropertiesList();
            expect(resourcePropList.length).toEqual(25);
            expect(resourcePropList.length).toEqual(MockOntologyAssertions.resourcePropertyIndexesAnythingThing.length);
            expect(resourcePropList.map(prop => prop.propertyIndex).sort()).toEqual(
              MockOntologyAssertions.resourcePropertyIndexesAnythingThing.sort()
            );

            done();
          });
      });
    });

    describe('Method reloadCachedItem()', () => {
      it('should reload a cached ontology', done => {
        // should return the same item as the getOntology() method
        knoraApiConnection.v2.ontologyCache['reloadCachedItem'](
          'http://0.0.0.0:3333/ontology/0001/anything/v2'
        ).subscribe((onto: ReadOntology) => {
          expect(onto.id).toEqual('http://0.0.0.0:3333/ontology/0001/anything/v2');

          expect(getOntoSpy).toHaveBeenCalledTimes(2);
          expect(getOntoSpy).toHaveBeenCalledWith('http://0.0.0.0:3333/ontology/0001/anything/v2');
          expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2'); // anything onto depends on knora-api

          expect(
            knoraApiConnection.v2.ontologyCache['cache']['http://0.0.0.0:3333/ontology/0001/anything/v2']
          ).not.toBeUndefined();
          expect(
            knoraApiConnection.v2.ontologyCache['cache']['http://api.knora.org/ontology/knora-api/v2']
          ).not.toBeUndefined(); // anything onto depends on knora-api

          done();
        });
      });
    });
  });

  describe('unsuccessful HTTP request', () => {
    const config = new KnoraApiConfig('http', '0.0.0.0', 3333, '', '', true);
    let knoraApiConnection: KnoraApiConnection;

    let getOntoSpy: jest.SpyInstance;

    beforeEach(() => {
      knoraApiConnection = new KnoraApiConnection(config);

      const ajaxError = new AjaxError('Error', new XMLHttpRequest(), {
        url: 'test-url',
        method: 'GET',
        async: true,
        headers: {},
        timeout: 0,
        user: undefined,
        password: undefined,
        crossDomain: false,
        responseType: 'json',
        withCredentials: false,
      });
      const apiResponseError = ApiResponseError.fromAjaxError(ajaxError);
      getOntoSpy = jest.spyOn(knoraApiConnection.v2.onto, 'getOntology').mockReturnValue(throwError(apiResponseError));
    });

    afterEach(() => {
      getOntoSpy.mockRestore();
    });

    describe('Method getItem()', () => {
      it('should attempt get an ontology with dependencies from the cache', done => {
        knoraApiConnection.v2.ontologyCache.getOntology('http://api.knora.org/ontology/knora-api/v2').subscribe(
          ontos => {},
          (err: ApiResponseError) => {
            expect(getOntoSpy).toHaveBeenCalledTimes(1);
            expect(getOntoSpy).toHaveBeenCalledWith('http://api.knora.org/ontology/knora-api/v2');

            done();
          }
        );
      });
    });
  });
});
