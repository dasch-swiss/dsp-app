import { JsonConvert, OperationMode, ValueCheckingMode } from 'json2typescript';
import { PropertyMatchingRule } from 'json2typescript';
import { OntologiesMetadata } from '../../../../src/models/v2/ontologies/ontology-metadata';
import { ResourceClassAndPropertyDefinitions } from '../../../../src/cache/ontology-cache/resource-class-and-property-definitions';
import { ResourceClassDefinitionWithPropertyDefinition } from '../../../../src/cache/ontology-cache/resource-class-definition-with-property-definition';
import { Constants } from '../../../../src/models/v2/Constants';
import { IHasProperty } from '../../../../src/models/v2/ontologies/class-definition';
import { OntologyConversionUtil } from '../../../../src/models/v2/ontologies/OntologyConversionUtil';
import { PropertyDefinition } from '../../../../src/models/v2/ontologies/property-definition';
import { ReadOntology } from '../../../../src/models/v2/ontologies/read/read-ontology';
import { ResourceClassDefinition } from '../../../../src/models/v2/ontologies/resource-class-definition';
import { ResourcePropertyDefinition } from '../../../../src/models/v2/ontologies/resource-property-definition';
import { StandoffClassDefinition } from '../../../../src/models/v2/ontologies/standoff-class-definition';
import { SystemPropertyDefinition } from '../../../../src/models/v2/ontologies/system-property-definition';
import anythingOntologyExpanded from '../v2/ontologies/anything-ontology-expanded.json';
import knoraApiOntologyExpanded from '../v2/ontologies/knora-api-ontology-expanded.json';

export namespace MockOntology {
  const jsonConvert: JsonConvert = new JsonConvert(
    OperationMode.ENABLE,
    ValueCheckingMode.DISALLOW_NULL,
    false,
    PropertyMatchingRule.CASE_STRICT
  );

  export const mockReadOntology = (ontoIri: string): ReadOntology => {
    let ontologyJsonld: any;

    switch (ontoIri) {
      case 'http://api.knora.org/ontology/knora-api/v2': {
        ontologyJsonld = knoraApiOntologyExpanded;
        break;
      }
      case 'http://0.0.0.0:3333/ontology/0001/anything/v2': {
        ontologyJsonld = anythingOntologyExpanded;
        break;
      }
      default: {
        throw new Error('Ontology not supported: ' + ontoIri);
      }
    }

    const onto = jsonConvert.deserializeObject(ontologyJsonld, ReadOntology);

    const entities: object[] = (ontologyJsonld as { [index: string]: object[] })['@graph'];

    // Convert resource classes
    entities
      .filter(OntologyConversionUtil.filterResourceClassDefinitions)
      .map(resclassJsonld => {
        return OntologyConversionUtil.convertEntity(resclassJsonld, ResourceClassDefinition, jsonConvert);
      })
      .forEach((resClass: ResourceClassDefinition) => {
        onto.classes[resClass.id] = resClass;
      });

    // Convert standoff classes
    entities
      .filter(OntologyConversionUtil.filterStandoffClassDefinitions)
      .map(standoffclassJsonld => {
        return OntologyConversionUtil.convertEntity(standoffclassJsonld, StandoffClassDefinition, jsonConvert);
      })
      .forEach((standoffClass: StandoffClassDefinition) => {
        onto.classes[standoffClass.id] = standoffClass;
      });

    // Convert resource properties (properties pointing to Knora values)
    entities
      .filter(OntologyConversionUtil.filterResourcePropertyDefinitions)
      .map(propertyJsonld => {
        return OntologyConversionUtil.convertEntity(propertyJsonld, ResourcePropertyDefinition, jsonConvert);
      })
      .forEach((prop: ResourcePropertyDefinition) => {
        onto.properties[prop.id] = prop;
      });

    // Convert system properties (properties not pointing to Knora values)
    entities
      .filter(OntologyConversionUtil.filterSystemPropertyDefintions)
      .map(propertyJsonld => {
        return OntologyConversionUtil.convertEntity(propertyJsonld, SystemPropertyDefinition, jsonConvert);
      })
      .forEach((prop: SystemPropertyDefinition) => {
        onto.properties[prop.id] = prop;
      });

    const referencedOntologies: Set<string> = new Set([]);

    if (ontoIri === 'http://0.0.0.0:3333/ontology/0001/anything/v2') {
      referencedOntologies.add('http://api.knora.org/ontology/knora-api/v2');
    }

    onto.dependsOnOntologies = referencedOntologies;

    return onto;
  };

  export const mockIResourceClassAndPropertyDefinitions = (
    resClassIri: string
  ): ResourceClassAndPropertyDefinitions => {
    const tmpClasses: { [index: string]: ResourceClassDefinition } = {};

    const tmpProps: { [index: string]: PropertyDefinition } = {};

    const anythingOntology: any = anythingOntologyExpanded;
    const knoraApiOntology: any = knoraApiOntologyExpanded;

    const knoraApiEntities = (knoraApiOntology as { [index: string]: object[] })['@graph'];
    const anythingEntities = (anythingOntology as { [index: string]: object[] })['@graph'];

    const entities = knoraApiEntities.concat(anythingEntities);

    // Convert resource classes
    entities
      .filter(OntologyConversionUtil.filterResourceClassDefinitions)
      .map(resclassJsonld => OntologyConversionUtil.convertEntity(resclassJsonld, ResourceClassDefinition, jsonConvert))
      .filter(resclassDef => resclassDef.id === resClassIri)
      .forEach((resClass: ResourceClassDefinition) => {
        tmpClasses[resClass.id] = resClass;
      });

    tmpClasses[resClassIri].propertiesList = tmpClasses[resClassIri].propertiesList.filter((prop: IHasProperty) => {
      // exclude rdfs:label
      return prop.propertyIndex !== Constants.Label;
    });

    // properties of anything Thing
    const props: string[] = tmpClasses[resClassIri].propertiesList.map(prop => prop.propertyIndex);

    // Convert resource properties (properties pointing to Knora values)
    entities
      .filter(OntologyConversionUtil.filterResourcePropertyDefinitions)
      .map((propertyJsonld: any) => {
        return OntologyConversionUtil.convertEntity(propertyJsonld, ResourcePropertyDefinition, jsonConvert);
      })
      .filter(propertyDef => props.indexOf(propertyDef.id) !== -1)
      .forEach((prop: ResourcePropertyDefinition) => {
        tmpProps[prop.id] = prop;
      });

    // Convert system properties (properties not pointing to Knora values)
    entities
      .filter(OntologyConversionUtil.filterSystemPropertyDefintions)
      .map((propertyJsonld: any) => {
        return OntologyConversionUtil.convertEntity(propertyJsonld, SystemPropertyDefinition, jsonConvert);
      })
      .filter(propertyDef => props.indexOf(propertyDef.id) !== -1)
      .forEach((prop: SystemPropertyDefinition) => {
        tmpProps[prop.id] = prop;
      });

    return new ResourceClassAndPropertyDefinitions(
      { [resClassIri]: new ResourceClassDefinitionWithPropertyDefinition(tmpClasses[resClassIri], tmpProps) },
      tmpProps
    );
  };
}
