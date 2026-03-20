import {
  JsonConvert,
  OperationMode,
  PropertyMatchingRule,
  ValueCheckingMode,
} from 'json2typescript';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs';
import { V2Endpoint } from '../../../../src/api/v2/v2-endpoint';
import { ListNodeV2Cache } from '../../../../src/cache/ListNodeV2Cache';
import { OntologyCache } from '../../../../src/cache/ontology-cache/OntologyCache';
import { KnoraApiConfig } from '../../../../src/knora-api-config';
import { ReadResource } from '../../../../src/models/v2/resources/read/read-resource';
import { ReadResourceSequence } from '../../../../src/models/v2/resources/read/read-resource-sequence';
import { ResourcesConversionUtil } from '../../../../src/models/v2/resources/ResourcesConversionUtil';
import testthing from '../v2/resources/testding-expanded.json';
import { MockList } from './mock-list';
import { MockOntology } from './mock-ontology';

export namespace MockResource {
  const jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  export const getTestThing = (): Observable<ReadResource> => {
    const config = new KnoraApiConfig('http', '');

    const v2Endpoint = new V2Endpoint(config, '');

    const ontoCache = new OntologyCache(config, v2Endpoint);

    const listNodeCache = new ListNodeV2Cache(v2Endpoint);

    // replace actual cache methods with class to existing mock factories

    // use ontology mock factory
    ontoCache.getResourceClassDefinition = (resClassIri: string) => {
      const mock = MockOntology.mockIResourceClassAndPropertyDefinitions(resClassIri);

      return of(mock);
    };

    // use list node mock factory
    listNodeCache.getNode = (listNodeIri: string) => {
      return of(MockList.mockNode(listNodeIri));
    };

    const resSeq: Observable<ReadResourceSequence> = ResourcesConversionUtil.createReadResourceSequence(
      testthing,
      ontoCache,
      listNodeCache,
      jsonConvert
    );

    return resSeq.pipe(map((seq: ReadResourceSequence) => seq.resources[0]));
  };

  export const getTestThings = (length = 25, mayHaveMoreResults = false): Observable<ReadResourceSequence> => {
    const resources: Array<Observable<ReadResource>> = new Array(length).fill(0).map(() => {
      return getTestThing();
    });

    return forkJoin(resources).pipe(
      map((res: ReadResource[]) => {
        return new ReadResourceSequence(res, mayHaveMoreResults);
      })
    );
  };
}
