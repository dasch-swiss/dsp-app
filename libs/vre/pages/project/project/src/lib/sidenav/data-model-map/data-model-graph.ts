import { Constants, PropertyDefinition, ReadOntology, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { LanguageStringDto, OntologyAndResourceClasses } from '@dasch-swiss/vre/3rd-party-services/open-api';

/**
 * `class`: a class of the mapped data model. `external`: a class of another data model.
 * `generic`: a knora-api class a link may point to, such as "any resource".
 */
export type DataModelNodeKind = 'class' | 'external' | 'generic';

export interface DataModelNode {
  /** The class IRI. */
  id: string;
  label: string;
  kind: DataModelNodeKind;
  /** Resources of the class; only set for classes of the mapped data model. */
  count?: number;
  /** Whether the class is one of this project's, so the data browser can open it. */
  navigable: boolean;
}

export interface DataModelEdge {
  source: string;
  target: string;
  /** The link property IRI; for a subclass edge, `rdfs:subClassOf`. */
  property: string;
  kind: 'link' | 'subclass';
}

export interface DataModelGraph {
  nodes: DataModelNode[];
  edges: DataModelEdge[];
}

const SUBCLASS_OF = 'http://www.w3.org/2000/01/rdf-schema#subClassOf';

/** Maintained by dsp-api from standoff markup on every resource; not a link the data model declares. */
const HAS_STANDOFF_LINK_TO = `${Constants.KnoraApiV2}${Constants.HashDelimiter}hasStandoffLinkTo`;

const localName = (iri: string) => iri.substring(iri.lastIndexOf('#') + 1);

/**
 * The classes of one data model and every link or subclass relation that starts or ends in it.
 *
 * @param ontology the data model to map, with its classes and resource counts
 * @param projectOntologies every data model of the project, to name and open classes outside `ontology`
 * @param definitions the project's ontologies and knora-api, which declare the link properties
 * @param labelOf picks the label to show from a class's labels in every language
 */
export function buildDataModelGraph(
  ontology: OntologyAndResourceClasses,
  projectOntologies: readonly OntologyAndResourceClasses[],
  definitions: readonly ReadOntology[],
  labelOf: (labels: LanguageStringDto[] | undefined) => string
): DataModelGraph {
  const projectClasses = new Map<string, string>();
  for (const onto of projectOntologies) {
    for (const { resourceClass } of onto.classesAndCount ?? []) {
      projectClasses.set(resourceClass.iri, labelOf(resourceClass.label));
    }
  }

  const nodes = new Map<string, DataModelNode>();
  for (const { resourceClass, itemCount } of ontology.classesAndCount ?? []) {
    nodes.set(resourceClass.iri, {
      id: resourceClass.iri,
      label: labelOf(resourceClass.label),
      kind: 'class',
      count: itemCount,
      navigable: true,
    });
  }

  const properties: Record<string, PropertyDefinition> = Object.assign({}, ...definitions.map(d => d.properties));
  const edges = new Map<string, DataModelEdge>();
  const addEdge = (edge: DataModelEdge) => {
    if (nodes.has(edge.source) || nodes.has(edge.target)) {
      edges.set(`${edge.source} ${edge.property} ${edge.target}`, edge);
    }
  };

  for (const definition of definitions) {
    for (const classDef of Object.values(definition.classes)) {
      if (!projectClasses.has(classDef.id)) {
        continue;
      }
      for (const hasProperty of classDef.propertiesList ?? []) {
        const property = properties[hasProperty.propertyIndex] as ResourcePropertyDefinition | undefined;
        const builtIn = hasProperty.propertyIndex.startsWith(Constants.KnoraApiV2);
        // An inherited project property is drawn once, from the class that declares it.
        if (!property?.isLinkProperty || property.isLinkValueProperty || !property.objectType) continue;
        if (property.id === HAS_STANDOFF_LINK_TO || (hasProperty.isInherited && !builtIn)) continue;
        addEdge({ source: classDef.id, target: property.objectType, property: property.id, kind: 'link' });
      }
      for (const superClass of classDef.subClassOf ?? []) {
        if (projectClasses.has(superClass)) {
          addEdge({ source: classDef.id, target: superClass, property: SUBCLASS_OF, kind: 'subclass' });
        }
      }
    }
  }

  for (const { source, target } of edges.values()) {
    for (const iri of [source, target]) {
      if (nodes.has(iri)) continue;
      const projectLabel = projectClasses.get(iri);
      nodes.set(iri, {
        id: iri,
        label: projectLabel ?? localName(iri),
        kind: projectLabel !== undefined ? 'external' : iri.startsWith(Constants.KnoraApiV2) ? 'generic' : 'external',
        navigable: projectLabel !== undefined,
      });
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
