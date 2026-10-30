import {
  Cardinality,
  Constants,
  PropertyDefinition,
  ReadOntology,
  ResourcePropertyDefinition,
  StringLiteralV2,
} from '@dasch-swiss/dsp-js';
import {
  LanguageStringDto,
  OntologyAndResourceClasses,
  RepresentationClass,
} from '@dasch-swiss/vre/3rd-party-services/open-api';

/**
 * `class`: a class of the mapped data model. `external`: a class of another data model.
 * `generic`: a knora-api class a link may point to, such as "any resource".
 */
export type DataModelNodeKind = 'class' | 'external' | 'generic';

/** One property a class declares, for the class details. */
export interface DataModelProperty {
  id: string;
  label: string;
  description: string;
  /** The value type's local name without "Value" (`Text`, `Date`, `List`…), or `Link` for a link. */
  type: string;
  /** The class a link points at; only set for links. */
  linkTarget?: string;
  cardinality: Cardinality;
}

export interface DataModelNode {
  /** The class IRI. */
  id: string;
  label: string;
  kind: DataModelNodeKind;
  /** Resources of the class; only set for classes of the mapped data model. */
  count?: number;
  /** Whether the class is one of this project's, so the data browser can open it. */
  navigable: boolean;
  /** The kind of file the class carries; only set for classes of the mapped data model. */
  representationClass?: RepresentationClass;
  /** The class's description in the ontology; only set for classes of the mapped data model. */
  description?: string;
  /** Labels of the class's own properties, in their form order; only set for classes of the mapped data model. */
  properties?: string[];
  /** The class's own properties, in their form order; only set for classes of the mapped data model. */
  propertyDetails?: DataModelProperty[];
}

export interface DataModelEdge {
  source: string;
  target: string;
  /** The link property IRI; for a subclass edge, `rdfs:subClassOf`. */
  property: string;
  /** The link property's label; empty for a subclass edge. */
  label: string;
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

type Labels = ReadonlyArray<StringLiteralV2 | LanguageStringDto> | undefined;

/** An entity's label or comment from its texts in every language, else its single-language text. */
const textOf = (
  entity: object,
  all: 'labels' | 'comments',
  one: 'label' | 'comment',
  labelOf: (t: Labels) => string
) => {
  const texts = (entity as Partial<Record<typeof all, StringLiteralV2[]>>)[all];
  return texts?.length ? labelOf(texts) : ((entity as Partial<Record<typeof one, string>>)[one] ?? '');
};

/**
 * The classes of one data model and every link or subclass relation that starts or ends in it.
 *
 * @param ontology the data model to map, with its classes and resource counts
 * @param projectOntologies every data model of the project, to name and open classes outside `ontology`
 * @param definitions the project's ontologies and knora-api, which declare the link properties
 * @param labelOf picks the text to show from a text in every language
 */
export function buildDataModelGraph(
  ontology: OntologyAndResourceClasses,
  projectOntologies: readonly OntologyAndResourceClasses[],
  definitions: readonly ReadOntology[],
  labelOf: (labels: Labels) => string
): DataModelGraph {
  const projectClasses = new Map<string, string>();
  for (const onto of projectOntologies) {
    for (const { resourceClass } of onto.classesAndCount ?? []) {
      projectClasses.set(resourceClass.iri, labelOf(resourceClass.label));
    }
  }

  const nodes = new Map<string, DataModelNode>();
  const properties: Record<string, PropertyDefinition> = Object.assign({}, ...definitions.map(d => d.properties));
  const classDefs = Object.assign({}, ...definitions.map(d => d.classes)) as ReadOntology['classes'];

  for (const { resourceClass, itemCount } of ontology.classesAndCount ?? []) {
    const classDef = classDefs[resourceClass.iri];
    const own = classDef ? ownProperties(classDef, properties, labelOf) : [];
    nodes.set(resourceClass.iri, {
      id: resourceClass.iri,
      label: labelOf(resourceClass.label),
      kind: 'class',
      count: itemCount,
      navigable: true,
      representationClass: resourceClass.representationClass,
      description: classDef ? textOf(classDef, 'comments', 'comment', labelOf) : '',
      properties: [...new Set(own.map(property => property.label))],
      propertyDetails: own,
    });
  }

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
        addEdge({
          source: classDef.id,
          target: property.objectType,
          property: property.id,
          label: textOf(property, 'labels', 'label', labelOf) || localName(property.id),
          kind: 'link',
        });
      }
      for (const superClass of classDef.subClassOf ?? []) {
        if (projectClasses.has(superClass)) {
          addEdge({ source: classDef.id, target: superClass, property: SUBCLASS_OF, label: '', kind: 'subclass' });
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

/** The properties a project declares on a class, not knora-api's, without link values, in their form order. */
function ownProperties(
  classDef: ReadOntology['classes'][string],
  properties: Record<string, PropertyDefinition>,
  labelOf: (labels: Labels) => string
): DataModelProperty[] {
  const seen = new Set<string>();
  return (
    [...classDef.propertiesList]
      // rdfs:label is every class's resource label, not a property the project declares.
      .filter(has => !has.propertyIndex.startsWith(Constants.KnoraApiV2) && has.propertyIndex !== Constants.Label)
      .sort((a, b) => (a.guiOrder ?? Infinity) - (b.guiOrder ?? Infinity))
      .flatMap(has => {
        const property = properties[has.propertyIndex] as ResourcePropertyDefinition | undefined;
        if (!property || property.isLinkValueProperty || seen.has(property.id)) return [];
        seen.add(property.id);
        const objectType = property.objectType ?? '';
        return [
          {
            id: property.id,
            label: textOf(property, 'labels', 'label', labelOf) || localName(property.id),
            description: textOf(property, 'comments', 'comment', labelOf),
            type: property.isLinkProperty ? 'Link' : localName(objectType).replace(/Value$/, ''),
            ...(property.isLinkProperty ? { linkTarget: objectType } : {}),
            cardinality: has.cardinality,
          },
        ];
      })
  );
}
