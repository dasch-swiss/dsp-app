import { JsonConvert } from 'json2typescript';
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs';
import { ListNodeV2Cache } from '../../../cache/ListNodeV2Cache';
import { OntologyCache } from '../../../cache/ontology-cache/OntologyCache';
import { Constants } from '../Constants';
import { ResourcePropertyDefinition } from '../ontologies/resource-property-definition';
import { CountQueryResponse } from '../search/count-query-response';
import { ReadResource } from './read/read-resource';
import { ReadResourceSequence } from './read/read-resource-sequence';
import { ReadBooleanValue } from './values/read/read-boolean-value';
import { ReadColorValue } from './values/read/read-color-value';
import { ParseReadDateValue, ReadDateValue } from './values/read/read-date-value';
import { ReadDecimalValue } from './values/read/read-decimal-value';
import {
  ReadArchiveFileValue,
  ReadAudioFileValue,
  ReadDocumentFileValue,
  ReadMovingImageFileValue,
  ReadStillImageExternalFileValue,
  ReadStillImageFileValue,
  ReadStillImageVectorFileValue,
  ReadTextFileValue,
} from './values/read/read-file-value';
import { ParseReadGeomValue, ReadGeomValue } from './values/read/read-geom-value';
import { ReadGeonameValue } from './values/read/read-geoname-value';
import { ReadIntValue } from './values/read/read-int-value';
import { ReadIntervalValue } from './values/read/read-interval-value';
import { ReadLinkValue } from './values/read/read-link-value';
import { ReadListValue } from './values/read/read-list-value';
import {
  ReadTextValue,
  ReadTextValueAsHtml,
  ReadTextValueAsString,
  ReadTextValueAsXml,
} from './values/read/read-text-value';
import { ReadTimeValue } from './values/read/read-time-value';
import { ReadUriValue } from './values/read/read-uri-value';
import { ReadValue } from './values/read/read-value';
import { ResourceClassAndPropertyDefinitions } from '../../../cache/ontology-cache/resource-class-and-property-definitions';

/**
 * @category Internal
 */
export namespace ResourcesConversionUtil {
  /**
   * Given a JSON-LD representing zero, one or more resources, converts it to an array of ReadResource.
   *
   * JSON-LD is expected to have expanded prefixes (processed by jsonld processor).
   *
   * @param resourcesJsonld a JSON-LD object with expanded prefixes representing zero, one or more resources.
   * @param ontologyCache instance of OntologyCache to be used.
   * @param listNodeCache instance of ListNodeCache to be used.
   * @param jsonConvert instance of JsonConvert to be used.
   */
  export const createReadResourceSequence = (
    resourcesJsonld: object,
    ontologyCache: OntologyCache,
    listNodeCache: ListNodeV2Cache,
    jsonConvert: JsonConvert
  ): Observable<ReadResourceSequence> => {
    if (resourcesJsonld.hasOwnProperty('@graph')) {
      let graphLength: number = (resourcesJsonld as { [index: string]: object[] })['@graph'].length;

      if (graphLength > 0) {
        // sequence of resources
        return forkJoin(
          ((resourcesJsonld as { [index: string]: object[] })['@graph'] as Array<{ [index: string]: object[] | string }>).map(
            res => createReadResource(res, ontologyCache, listNodeCache, jsonConvert)
          )
        ).pipe(
          map((resources: ReadResource[]) => {
            // check for mayHaveMoreResults
            if (resourcesJsonld.hasOwnProperty(Constants.MayHaveMoreResults)) {
              // presence of knora-api:mayHaveMoreResults implicitly means true
              return new ReadResourceSequence(resources, true);
            } else {
              return new ReadResourceSequence(resources);
            }
          })
        );
      } else {
        if (resourcesJsonld.hasOwnProperty(Constants.MayHaveMoreResults)) {
          return of(new ReadResourceSequence([], true));
        } else {
          return of(new ReadResourceSequence([]));
        }
      }
    } else {
      //  one or no resource
      if (Object.keys(resourcesJsonld).length === 0) {
        return of(new ReadResourceSequence([]));
      } else {
        return forkJoin([
          createReadResource(
            resourcesJsonld as { [index: string]: object[] | string },
            ontologyCache,
            listNodeCache,
            jsonConvert
          ),
        ]).pipe(
          map((resources: ReadResource[]) => {
            return new ReadResourceSequence(resources);
          })
        );
      }
    }
  };

  /**
   * Creates a single ReadResource.
   *
   * @param resourceJsonld a JSON-LD object representing a single resource.
   * @param ontologyCache instance of OntologyCache to be used.
   * @param listNodeCache instance of ListNodeCache to be used.
   * @param jsonConvert instance of JsonConvert to be used.
   */
  const createReadResource = (
    resourceJsonld: { [index: string]: string | object[] },
    ontologyCache: OntologyCache,
    listNodeCache: ListNodeV2Cache,
    jsonConvert: JsonConvert
  ): Observable<ReadResource> => {
    if (Array.isArray(resourceJsonld)) throw new Error('resource is expected to be a single object');

    const resource = jsonConvert.deserialize(resourceJsonld, ReadResource) as ReadResource;

    return ontologyCache.getResourceClassDefinition(resource.type).pipe(
      mergeMap((entitiyDefs: ResourceClassAndPropertyDefinitions) => {
        const resourceProps: string[] = Object.keys(resourceJsonld).filter((propIri: string) => {
          return entitiyDefs.properties[propIri] instanceof ResourcePropertyDefinition;
        });

        // add information from ontology (if exists)
        if (entitiyDefs.classes[resource.type]) {
          resource.resourceClassLabel = entitiyDefs.classes[resource.type].label;
          resource.resourceClassComment = entitiyDefs.classes[resource.type].comment;
        } else {
          // the label is not defined in this ontology
          if (resource.type === Constants.DeletedResource) {
            resource.resourceClassLabel = resource.label;
          } else {
            console.warn('unsupported type: ', resource.type);
            resource.resourceClassLabel = resource.type;
          }
        }
        resource.entityInfo = entitiyDefs;

        if (resourceProps.length > 0) {
          const values: Array<Observable<ReadValue>> = [];

          resourceProps.forEach((propIri: string) => {
            if (Array.isArray(resourceJsonld[propIri])) {
              for (const value of resourceJsonld[propIri]) {
                values.push(createValueValue(propIri, value, entitiyDefs, ontologyCache, listNodeCache, jsonConvert));
              }
            } else {
              values.push(
                createValueValue(
                  propIri,
                  resourceJsonld[propIri],
                  entitiyDefs,
                  ontologyCache,
                  listNodeCache,
                  jsonConvert
                )
              );
            }
          });

          return forkJoin(values).pipe(
            map((vals: ReadValue[]) => {
              // get link values
              const linkVals: ReadLinkValue[] = vals.filter((val: ReadValue) => {
                return val instanceof ReadLinkValue;
              }) as ReadLinkValue[];

              // incoming references with embedded resource
              const incomingRefs: ReadLinkValue[] = linkVals.filter((linkVal: ReadLinkValue) => {
                return linkVal.incoming && linkVal.linkedResource !== undefined;
              });

              // outgoing references with embedded resource
              const outgoingRefs = linkVals.filter((linkVal: ReadLinkValue) => {
                return !linkVal.incoming && linkVal.linkedResource !== undefined;
              });

              // create a map structure property Iri -> values
              const propMap: { [index: string]: ReadValue[] } = {};

              vals.forEach((val: ReadValue) => {
                if (!propMap.hasOwnProperty(val.property)) {
                  propMap[val.property] = [val];
                } else {
                  propMap[val.property].push(val);
                }
              });

              // assign values
              resource.properties = propMap;

              resource.incomingReferences = incomingRefs.map(
                (linkVal: ReadLinkValue) => linkVal.linkedResource as ReadResource
              );

              resource.outgoingReferences = outgoingRefs.map(
                (linkVal: ReadLinkValue) => linkVal.linkedResource as ReadResource
              );

              return resource;
            })
          );
        } else {
          return of(resource);
        }
      })
    );
  };

  /**
   * Converts a simple value serialized as JSON-LD to a `ReadValue`.
   *
   * @param valueJsonld value as JSON-LD to be converted.
   * @param dataType the specific value type to convert to.
   * @param jsonConvert the converter to be used.
   */
  const handleSimpleValue = <T extends ReadValue>(
    valueJsonld: object,
    dataType: { new (): T },
    jsonConvert: JsonConvert
  ): Observable<T> => {
    return of(jsonConvert.deserialize(valueJsonld, dataType) as T);
  };

  /**
   * Converts a text value serialized as JSON-LD to a `ReadTextValue`.
   *
   * @param valueJsonld text value as JSON-LD to be converted.
   * @param jsonConvert jsonConvert the converter to be used.
   */
  const handleTextValue = (valueJsonld: object, jsonConvert: JsonConvert): Observable<ReadTextValue> => {
    if (valueJsonld.hasOwnProperty(Constants.ValueAsString)) {
      // TODO: query standoff, if any.
      const textValue = jsonConvert.deserialize(valueJsonld, ReadTextValueAsString) as ReadTextValueAsString;
      return of(textValue);
    } else if (valueJsonld.hasOwnProperty(Constants.TextValueAsHtml)) {
      const textValue = jsonConvert.deserialize(valueJsonld, ReadTextValueAsHtml) as ReadTextValueAsHtml;
      return of(textValue);
    } else if (valueJsonld.hasOwnProperty(Constants.TextValueAsXml)) {
      const textValue = jsonConvert.deserialize(valueJsonld, ReadTextValueAsXml) as ReadTextValueAsXml;
      return of(textValue);
    } else {
      throw new Error('Invalid Text value');
    }
  };

  /**
   * Converts a link value serialized as JSON-LD to a `ReadTextValue`.
   *
   * @param valueJsonld link value as JSON-LD to be converted.
   * @param ontologyCache instance of `OntologyCache` to be used.
   * @param listNodeCache instance of ListNodeCache to be used.
   * @param jsonConvert jsonConvert the converter to be used.
   */
  const handleLinkValue = (
    valueJsonld: any,
    ontologyCache: OntologyCache,
    listNodeCache: ListNodeV2Cache,
    jsonConvert: JsonConvert
  ): Observable<ReadLinkValue> => {
    const linkValue = jsonConvert.deserialize(valueJsonld as object, ReadLinkValue) as ReadLinkValue;

    const handleLinkedResource = (
      linkedResource: { [index: string]: string | object[] },
      incoming: boolean
    ): Observable<ReadLinkValue> => {
      const referredRes: Observable<ReadResource> = createReadResource(
        linkedResource,
        ontologyCache,
        listNodeCache,
        jsonConvert
      );
      return referredRes.pipe(
        map(refRes => {
          linkValue.linkedResource = refRes;
          linkValue.linkedResourceIri = refRes.id;
          linkValue.incoming = incoming;
          return linkValue;
        })
      );
    };

    const handleLinkedResourceIri = (linkedResourceIri: string, incoming: boolean): Observable<ReadLinkValue> => {
      if (linkedResourceIri === undefined) throw new Error('Invalid resource Iri');
      linkValue.linkedResourceIri = linkedResourceIri;
      linkValue.incoming = incoming;
      return of(linkValue);
    };

    // check if linked resource is nested or if just its IRI is present
    if (valueJsonld.hasOwnProperty(Constants.LinkValueHasTarget)) {
      return handleLinkedResource(valueJsonld[Constants.LinkValueHasTarget], false);
    } else if (valueJsonld.hasOwnProperty(Constants.LinkValueHasTargetIri)) {
      // TODO: check for existence of @id
      return handleLinkedResourceIri(valueJsonld[Constants.LinkValueHasTargetIri]['@id'], false);
    } else if (valueJsonld.hasOwnProperty(Constants.LinkValueHasSource)) {
      return handleLinkedResource(valueJsonld[Constants.LinkValueHasSource], true);
    } else if (valueJsonld.hasOwnProperty(Constants.LinkValueHasSourceIri)) {
      // TODO: check for existence of @id
      return handleLinkedResourceIri(valueJsonld[Constants.LinkValueHasSourceIri]['@id'], true);
    } else {
      throw new Error('Invalid Link Value');
    }
  };

  /**
   * Creates a single ReadValue.
   *
   * @param propIri Iri of the property pointing to the value.
   * @param valueJsonld JSON-LD object representing a single value.
   * @param entitiyDefs entity definitions for the given value type.
   * @param ontologyCache instance of OntologyCache to be used.
   * @param listNodeCache instance of ListNodeCache to be used.
   * @param jsonConvert instance of JsonConvert to be used.
   */
  const createValueValue = (
    propIri: string,
    valueJsonld: any,
    entitiyDefs: ResourceClassAndPropertyDefinitions,
    ontologyCache: OntologyCache,
    listNodeCache: ListNodeV2Cache,
    jsonConvert: JsonConvert
  ): Observable<ReadValue> => {
    if (Array.isArray(valueJsonld)) throw new Error('value is expected to be a single object');

    const type = valueJsonld['@type'];

    let value: Observable<ReadValue>;

    switch (type) {
      case Constants.BooleanValue: {
        const boolVal = handleSimpleValue(valueJsonld, ReadBooleanValue, jsonConvert);
        value = boolVal.pipe(
          map((val: ReadBooleanValue) => {
            val.strval = val.bool ? 'TRUE' : 'FALSE';
            return val;
          })
        );
        break;
      }

      case Constants.ColorValue: {
        const colorVal = handleSimpleValue(valueJsonld, ReadColorValue, jsonConvert);
        value = colorVal.pipe(
          map((val: ReadColorValue) => {
            val.strval = val.color;
            return val;
          })
        );
        break;
      }

      case Constants.DateValue: {
        const dateVal = handleSimpleValue(valueJsonld, ParseReadDateValue, jsonConvert);
        value = dateVal.pipe(
          map((val: ParseReadDateValue) => {
            return new ReadDateValue(val);
          })
        );
        break;
      }

      case Constants.IntValue: {
        const intVal = handleSimpleValue(valueJsonld, ReadIntValue, jsonConvert);
        value = intVal.pipe(
          map((val: ReadIntValue) => {
            val.strval = val.int.toString();
            return val;
          })
        );
        break;
      }

      case Constants.DecimalValue: {
        const decimalVal = handleSimpleValue(valueJsonld, ReadDecimalValue, jsonConvert);
        value = decimalVal.pipe(
          map((val: ReadDecimalValue) => {
            val.strval = val.decimal.toString();
            return val;
          })
        );
        break;
      }

      case Constants.IntervalValue: {
        const intervalVal = handleSimpleValue(valueJsonld, ReadIntervalValue, jsonConvert);
        value = intervalVal.pipe(
          map((val: ReadIntervalValue) => {
            val.strval = val.start.toString() + ' - ' + val.end.toString();
            return val;
          })
        );
        break;
      }

      case Constants.ListValue: {
        const listValue = (value = handleSimpleValue(valueJsonld, ReadListValue, jsonConvert));
        value = listValue.pipe(
          mergeMap((listVal: ReadListValue) => {
            // get referred list node's label
            return listNodeCache.getNode(listVal.listNode).pipe(
              map(listNode => {
                listVal.listNodeLabel = listNode.label;
                listVal.strval = listNode.label;
                return listVal;
              })
            );
          })
        );
        break;
      }

      case Constants.UriValue: {
        const uriVal = handleSimpleValue(valueJsonld, ReadUriValue, jsonConvert);
        value = uriVal.pipe(
          map((val: ReadUriValue) => {
            val.strval = val.uri;
            return val;
          })
        );
        break;
      }

      case Constants.TextValue: {
        const textVal = handleTextValue(valueJsonld, jsonConvert);
        value = textVal.pipe(
          map((val: ReadTextValue) => {
            if (val instanceof ReadTextValueAsString) {
              val.strval = val.text;
            } else if (val instanceof ReadTextValueAsXml) {
              val.strval = val.xml;
            } else if (val instanceof ReadTextValueAsHtml) {
              val.strval = val.html;
            } else {
              console.error('String representation for a ReadTextValue could not be constructed for: ', type);
            }
            return val;
          })
        );
        break;
      }

      case Constants.LinkValue: {
        const linkVal = handleLinkValue(valueJsonld, ontologyCache, listNodeCache, jsonConvert);
        value = linkVal.pipe(
          map((val: ReadLinkValue) => {
            if (val.linkedResource !== undefined) {
              val.strval = val.linkedResource.label;
            } else {
              val.strval = val.linkedResourceIri;
            }
            return val;
          })
        );
        break;
      }

      case Constants.GeomValue: {
        const geomVal = handleSimpleValue(valueJsonld, ParseReadGeomValue, jsonConvert);
        value = geomVal.pipe(
          map((geom: ParseReadGeomValue) => {
            return new ReadGeomValue(geom);
          })
        );
        break;
      }

      case Constants.AudioFileValue: {
        const audioVal = handleSimpleValue(valueJsonld, ReadAudioFileValue, jsonConvert);
        value = audioVal.pipe(
          map((val: ReadAudioFileValue) => {
            val.strval = val.fileUrl;
            return val;
          })
        );
        break;
      }

      case Constants.DocumentFileValue: {
        const documentVal = handleSimpleValue(valueJsonld, ReadDocumentFileValue, jsonConvert);
        value = documentVal.pipe(
          map((val: ReadDocumentFileValue) => {
            val.strval = val.fileUrl;
            return val;
          })
        );
        break;
      }

      case Constants.MovingImageFileValue: {
        const movingImageVal = handleSimpleValue(valueJsonld, ReadMovingImageFileValue, jsonConvert);
        value = movingImageVal.pipe(
          map((val: ReadMovingImageFileValue) => {
            val.strval = val.fileUrl;
            return val;
          })
        );
        break;
      }

      case Constants.StillImageFileValue: {
        const stillImageVal = handleSimpleValue(valueJsonld, ReadStillImageFileValue, jsonConvert);
        value = stillImageVal.pipe(
          map((val: ReadStillImageFileValue) => {
            val.strval = val.fileUrl;
            return val;
          })
        );
        break;
      }

      case Constants.StillImageExternalFileValue: {
        const extStillImageVal = handleSimpleValue(valueJsonld, ReadStillImageExternalFileValue, jsonConvert);
        value = extStillImageVal.pipe(
          map((val: ReadStillImageExternalFileValue) => {
            return val;
          })
        );
        break;
      }

      case Constants.StillImageVectorFileValue: {
        const vectorStillImageVal = handleSimpleValue(valueJsonld, ReadStillImageVectorFileValue, jsonConvert);
        value = vectorStillImageVal.pipe(
          map((val: ReadStillImageVectorFileValue) => {
            val.strval = val.fileUrl;
            return val;
          })
        );
        break;
      }

      case Constants.ArchiveFileValue: {
        const archiveVal = handleSimpleValue(valueJsonld, ReadArchiveFileValue, jsonConvert);
        value = archiveVal.pipe(
          map((val: ReadArchiveFileValue) => {
            val.strval = val.fileUrl;
            return val;
          })
        );
        break;
      }

      case Constants.TextFileValue: {
        const textVal = handleSimpleValue(valueJsonld, ReadTextFileValue, jsonConvert);
        value = textVal.pipe(
          map((val: ReadTextFileValue) => {
            val.strval = val.fileUrl;
            return val;
          })
        );
        break;
      }

      case Constants.TimeValue: {
        const timeVal = handleSimpleValue(valueJsonld, ReadTimeValue, jsonConvert);
        value = timeVal.pipe(
          map((val: ReadTimeValue) => {
            val.strval = val.time;
            return val;
          })
        );
        break;
      }

      case Constants.GeonameValue: {
        const geonameVal = handleSimpleValue(valueJsonld, ReadGeonameValue, jsonConvert);
        value = geonameVal.pipe(
          map((val: ReadGeonameValue) => {
            val.strval = val.geoname;
            return val;
          })
        );
        break;
      }

      default: {
        console.error('Unknown value type: ', type);
        value = of(jsonConvert.deserialize(valueJsonld as object, ReadValue) as ReadValue);
      }
    }

    return value.pipe(
      map(val => {
        val.property = propIri;
        val.propertyLabel = entitiyDefs.properties[propIri].label;
        val.propertyComment = entitiyDefs.properties[propIri].comment;

        return val;
      })
    );
  };
  /**
   * Creates a response to a count query.
   * @param countQueryResult the result of the count query.
   * @param jsonConvert the instance of jsonConvert to be used.
   */
  export const createCountQueryResponse = (countQueryResult: object, jsonConvert: JsonConvert): CountQueryResponse => {
    if (Array.isArray(countQueryResult)) throw new Error('countQueryResult is expected to be a single object');

    return jsonConvert.deserialize(countQueryResult, CountQueryResponse) as CountQueryResponse;
  };
}
