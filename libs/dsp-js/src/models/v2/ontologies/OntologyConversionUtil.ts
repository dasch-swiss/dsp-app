import { JsonConvert } from 'json2typescript';
import { KnoraApiConfig } from '../../../knora-api-config';
import { Constants } from '../Constants';
import { TypeGuard } from '../resources/type-guard';
import { IHasProperty } from './class-definition';
import { EntityDefinition } from './EntityDefinition';
import { OntologiesMetadata, OntologyMetadata } from './ontology-metadata';
import { ReadOntology } from './read/read-ontology';
import { ResourceClassDefinition, ResourceClassDefinitionWithAllLanguages } from './resource-class-definition';
import { ResourcePropertyDefinition, ResourcePropertyDefinitionWithAllLanguages } from './resource-property-definition';
import { StandoffClassDefinition, StandoffClassDefinitionWithAllLanguages } from './standoff-class-definition';
import { SystemPropertyDefinition, SystemPropertyDefinitionWithAllLanguages } from './system-property-definition';

/**
 * @category Internal
 */
export namespace OntologyConversionUtil {
  /**
   * Given a Knora entity IRI, gets the ontology Iri.
   * External entity Iris are ignored.
   *
   * @param entityIri an entity Iri.
   * @param knoraApiConfig the Knora api configuration.
   * @return the ontology IRI as the only entry in an array, otherwise an empty array.
   */
  export const getOntologyIriFromEntityIri = (entityIri: string, knoraApiConfig: KnoraApiConfig): string[] => {
    const ontologyIri: string[] = [];

    // set `http` regardless of  knoraApiConfig.apiProtocol
    // include port only when running locally
    let projectEntityBase = 'http://' + knoraApiConfig.apiHost;
    if (
      knoraApiConfig.apiPort !== null &&
      (knoraApiConfig.apiHost === 'localhost' || knoraApiConfig.apiHost === '0.0.0.0')
    ) {
      projectEntityBase = projectEntityBase + ':' + knoraApiConfig.apiPort;
    }
    projectEntityBase = projectEntityBase + '/ontology/';

    // Check if the given entity Iri belongs to knora-api or a project ontology.
    // Ignore external entity Iris.
    if (entityIri.indexOf(Constants.KnoraApiV2) === 0) {
      ontologyIri.push(Constants.KnoraApiV2);
    } else if (entityIri.indexOf(projectEntityBase) === 0) {
      // split entity Iri on "#"
      const segments: string[] = entityIri.split(Constants.HashDelimiter);

      if (segments.length === 2) {
        // First segment identifies the project ontology the entity belongs to.
        ontologyIri.push(segments[0]);
      } else {
        console.error(`Error: ${entityIri} is not a valid Knora entity IRI.`);
      }
    }

    return ontologyIri;
  };

  /**
   * Determines resource class definitions when passed to filter() applied to an array of entity definitions.
   *
   * @param entity the entity definition to be analyzed.
   */
  export const filterResourceClassDefinitions = (entity: { [index: string]: any }): boolean => {
    return entity.hasOwnProperty(Constants.IsResourceClass) && entity[Constants.IsResourceClass] === true;
  };

  /**
   * Determines standoff class definitions when passed to filter() applied to an array of entity definitions.
   *
   * @param entity the entity definition to be analyzed.
   */
  export const filterStandoffClassDefinitions = (entity: { [index: string]: any }): boolean => {
    return entity.hasOwnProperty(Constants.IsStandoffClass) && entity[Constants.IsStandoffClass] === true;
  };

  /**
   * Determines resource property definitions when passed to filter() applied to an array of entity definitions.
   *
   * @param entity the entity definition to be analyzed.
   */
  export const filterResourcePropertyDefinitions = (entity: { [index: string]: any }): boolean => {
    return entity.hasOwnProperty(Constants.IsResourceProperty) && entity[Constants.IsResourceProperty] === true;
  };

  /**
   * Determines system property definitions when passed to filter() applied to an array of entity definitions.
   *
   * @param entity the entity definition to be analyzed.
   */
  export const filterSystemPropertyDefintions = (entity: { [index: string]: any }): boolean => {
    return (
      (entity['@type'] === Constants.DataTypeProperty || entity['@type'] === Constants.ObjectProperty) &&
      !entity.hasOwnProperty(Constants.IsResourceProperty)
    );
  };

  /**
   * Converts an entity definition to the specified type.
   *
   * @param entity the entity definition to be converted.
   * @param dataType the target type of the conversion.
   * @param jsonConvert the converter to be used.
   */
  export const convertEntity = <T extends EntityDefinition>(
    entity: object,
    dataType: { new (): T },
    jsonConvert: JsonConvert
  ): T => {
    return jsonConvert.deserializeObject(entity, dataType);
  };

  /**
   * Given an array of entities, converts and adds them to the given ontology.
   *
   * @param ontology the ontology to which the definitions should be added.
   * @param entities the entities to be converted and added.
   * @param jsonConvert instance of JsonConvert to be used.
   */
  const convertAndAddEntityDefinitions = (
    ontology: ReadOntology,
    entities: object[],
    jsonConvert: JsonConvert
  ): void => {
    // Convert resource classes
    entities
      .filter(filterResourceClassDefinitions)
      .map(resclassJsonld => {
        return convertEntity(resclassJsonld, ResourceClassDefinition, jsonConvert);
      })
      .forEach((resClass: ResourceClassDefinition) => {
        ontology.classes[resClass.id] = resClass;
      });

    // Convert standoff classes
    entities
      .filter(filterStandoffClassDefinitions)
      .map(standoffclassJsonld => {
        return convertEntity(standoffclassJsonld, StandoffClassDefinition, jsonConvert);
      })
      .forEach((standoffClass: StandoffClassDefinition) => {
        ontology.classes[standoffClass.id] = standoffClass;
      });

    // Convert resource properties (properties pointing to Knora values)
    entities
      .filter(filterResourcePropertyDefinitions)
      .map(propertyJsonld => {
        return convertEntity(propertyJsonld, ResourcePropertyDefinition, jsonConvert);
      })
      .forEach((prop: ResourcePropertyDefinition) => {
        ontology.properties[prop.id] = prop;
      });

    // Convert system properties (properties not pointing to Knora values)
    entities
      .filter(filterSystemPropertyDefintions)
      .map(propertyJsonld => {
        return convertEntity(propertyJsonld, SystemPropertyDefinition, jsonConvert);
      })
      .forEach((prop: SystemPropertyDefinition) => {
        ontology.properties[prop.id] = prop;
      });
  };

  /**
   * Given an array of entities with labels and comments for all languages,
   * converts and adds them to the given ontology.
   *
   * @param ontology the ontology to which the definitions should be added.
   * @param entities the entities to be converted and added.
   * @param jsonConvert instance of JsonConvert to be used.
   */
  const convertAndAddEntityDefinitionsWithAllLanguages = (
    ontology: ReadOntology,
    entities: object[],
    jsonConvert: JsonConvert
  ): void => {
    // Convert resource classes
    entities
      .filter(filterResourceClassDefinitions)
      .map(resclassJsonld => {
        return convertEntity(resclassJsonld, ResourceClassDefinitionWithAllLanguages, jsonConvert);
      })
      .forEach((resClass: ResourceClassDefinition) => {
        ontology.classes[resClass.id] = resClass;
      });

    // Convert standoff classes
    entities
      .filter(filterStandoffClassDefinitions)
      .map(standoffclassJsonld => {
        return convertEntity(standoffclassJsonld, StandoffClassDefinitionWithAllLanguages, jsonConvert);
      })
      .forEach((standoffClass: StandoffClassDefinition) => {
        ontology.classes[standoffClass.id] = standoffClass;
      });

    // Convert resource properties (properties pointing to Knora values)
    entities
      .filter(filterResourcePropertyDefinitions)
      .map(propertyJsonld => {
        return convertEntity(propertyJsonld, ResourcePropertyDefinitionWithAllLanguages, jsonConvert);
      })
      .forEach((prop: ResourcePropertyDefinition) => {
        ontology.properties[prop.id] = prop;
      });

    // Convert system properties (properties not pointing to Knora values)
    entities
      .filter(filterSystemPropertyDefintions)
      .map(propertyJsonld => {
        return convertEntity(propertyJsonld, SystemPropertyDefinitionWithAllLanguages, jsonConvert);
      })
      .forEach((prop: SystemPropertyDefinition) => {
        ontology.properties[prop.id] = prop;
      });
  };

  /**
   * Given an ontology, analyzes its direct dependencies and adds them to the given ontology.
   *
   * @param ontology the ontology whose direct dependencies should be analyzed.
   * @param knoraApiConfig the Knora API config to be used.
   */
  const analyzeDirectDependencies = (ontology: ReadOntology, knoraApiConfig: KnoraApiConfig): void => {
    // Ontologies referenced by this ontology
    const referencedOntologies: Set<string> = new Set([]);

    // Collect ontologies referenced by this ontology in resource classes:
    // references to properties (cardinalities) and resource classes (super classes)
    for (const index in ontology.classes) {
      if (ontology.classes.hasOwnProperty(index)) {
        ontology.classes[index].propertiesList.forEach((prop: IHasProperty) => {
          getOntologyIriFromEntityIri(prop.propertyIndex, knoraApiConfig).forEach(ontoIri =>
            referencedOntologies.add(ontoIri)
          );
        });
        ontology.classes[index].subClassOf.forEach((superClass: string) => {
          getOntologyIriFromEntityIri(superClass, knoraApiConfig).forEach(ontoIri => referencedOntologies.add(ontoIri));
        });
      }
    }

    // Collect ontologies referenced by this ontology in properties:
    // references to other properties (super properties) and resource classes (subject and object types)
    for (const index in ontology.properties) {
      if (ontology.properties.hasOwnProperty(index)) {
        if (ontology.properties[index].objectType !== undefined) {
          getOntologyIriFromEntityIri(ontology.properties[index].objectType as string, knoraApiConfig).forEach(
            ontoIri => referencedOntologies.add(ontoIri)
          );
        }
        if (ontology.properties[index].subjectType !== undefined) {
          getOntologyIriFromEntityIri(ontology.properties[index].subjectType as string, knoraApiConfig).forEach(
            ontoIri => referencedOntologies.add(ontoIri)
          );
        }
        ontology.properties[index].subPropertyOf.forEach((superProperty: string) => {
          getOntologyIriFromEntityIri(superProperty, knoraApiConfig).forEach(ontoIri =>
            referencedOntologies.add(ontoIri)
          );
        });
      }
    }

    // Remove this ontology from the collection
    referencedOntologies.delete(ontology.id);

    ontology.dependsOnOntologies = referencedOntologies;
  };

  /**
   * Converts an ontology serialized as JSON-LD to an instance of `ReadOntology`.
   *
   * @param ontologyJsonld ontology as JSON-LD already processed by the jsonld-processor.
   * @param jsonConvert instance of JsonConvert to use.
   * @param knoraApiConfig config object to use.
   * @param allLanguages indicates if labels and comments were fetched for all languages.
   * @return the ontology as a `ReadOntology`.
   */
  export const convertOntology = (
    ontologyJsonld: object,
    jsonConvert: JsonConvert,
    knoraApiConfig: KnoraApiConfig,
    allLanguages: boolean
  ): ReadOntology => {
    const ontology: ReadOntology = jsonConvert.deserializeObject(ontologyJsonld, ReadOntology);

    // Access the collection of entities
    const entities: object[] = (ontologyJsonld as { [index: string]: object[] })['@graph'];

    if (!Array.isArray(entities))
      throw new Error("An ontology is expected to have a member '@graph' containing an array of entities");

    if (!allLanguages) {
      convertAndAddEntityDefinitions(ontology, entities, jsonConvert);
    } else {
      convertAndAddEntityDefinitionsWithAllLanguages(ontology, entities, jsonConvert);
    }

    analyzeDirectDependencies(ontology, knoraApiConfig);

    return ontology;
  };

  /**
   * Converts a list of ontologies or a single ontology serialized as JSON-LD to an instance of `OntologiesMetadata`
   *
   * @param ontologiesJsonld JSON-LD representing ontology metadata.
   * @param jsonConvert instance of JsonConvert to use.
   */
  export const convertOntologiesList = (ontologiesJsonld: object, jsonConvert: JsonConvert): OntologiesMetadata => {
    if (ontologiesJsonld.hasOwnProperty('@graph')) {
      return jsonConvert.deserializeObject(ontologiesJsonld, OntologiesMetadata);
    } else {
      const ontologies: OntologiesMetadata = new OntologiesMetadata();
      // add ontologies, if any
      if (Object.keys(ontologiesJsonld).length > 0) {
        ontologies.ontologies = [jsonConvert.deserializeObject(ontologiesJsonld, OntologyMetadata)];
      }
      return ontologies;
    }
  };

  /**
   * Converts the response from createResourceClass serialized as JSON-LD to an instance of `ResourceClassDefinition`
   *
   * @param  resClassJsonld JSON-LD representing a resource class definition.
   * @param  jsonConvert instance of JsonConvert to use.
   */
  export const convertResourceClassResponse = (
    resClassJsonld: object,
    jsonConvert: JsonConvert
  ): ResourceClassDefinitionWithAllLanguages => {
    if (resClassJsonld.hasOwnProperty('@graph')) {
      const deserializedObj = jsonConvert.deserializeObject(
        (resClassJsonld as any)['@graph'][0],
        ResourceClassDefinitionWithAllLanguages
      );
      deserializedObj.lastModificationDate = jsonConvert.deserializeObject(
        resClassJsonld,
        OntologyMetadata
      ).lastModificationDate;
      return deserializedObj;
    } else {
      return jsonConvert.deserializeObject(resClassJsonld, ResourceClassDefinitionWithAllLanguages);
    }
  };

  /**
   * Converts the response from createResourceProperty serialized as JSON-LD to an instance of `ResourcePropertyDefinition`
   *
   * @param  resPropJsonld JSON-LD representing a resource property definition.
   * @param  jsonConvert instance of JsonConvert to use.
   */
  export const convertResourcePropertyResponse = (
    resPropJsonld: object,
    jsonConvert: JsonConvert
  ): ResourcePropertyDefinitionWithAllLanguages => {
    if (resPropJsonld.hasOwnProperty('@graph')) {
      const deserializedObj = jsonConvert.deserializeObject(
        (resPropJsonld as any)['@graph'][0],
        ResourcePropertyDefinitionWithAllLanguages
      );
      deserializedObj.lastModificationDate = jsonConvert.deserializeObject(
        resPropJsonld,
        OntologyMetadata
      ).lastModificationDate;
      return deserializedObj;
    } else {
      return jsonConvert.deserializeObject(resPropJsonld, ResourcePropertyDefinitionWithAllLanguages);
    }
  };
}
