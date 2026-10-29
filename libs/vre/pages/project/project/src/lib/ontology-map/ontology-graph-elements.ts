import type { ElementDefinition } from 'cytoscape';
import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';

/** The layouts the graph view offers: a tree following the links, a circle, a force-directed spread, a grid. */
export type GraphLayout = 'tree' | 'circle' | 'force' | 'grid';

/** How big the graph draws boxes, text and lines, against the space between classes. */
export type GraphSize = 'small' | 'normal' | 'large';

export const GRAPH_SIZE_FACTOR: Record<GraphSize, number> = { small: 1.25, normal: 1.75, large: 2.5 };

/**
 * Light colours that tell classes apart, all dark-text legible (ColorBrewer Set3, then Pastel1); a data model with
 * more classes repeats them.
 */
export const CLASS_COLORS = [
  '#8DD3C7',
  '#FFFFB3',
  '#BEBADA',
  '#FB8072',
  '#80B1D3',
  '#FDB462',
  '#B3DE69',
  '#FCCDE5',
  '#BC80BD',
  '#CCEBC5',
  '#FFED6F',
  '#D9D9D9',
  '#FBB4AE',
  '#B3CDE3',
  '#DECBE4',
  '#FED9A6',
  '#E5D8BD',
  '#FDDAEC',
];

/** A colour per class of the data model, in label order, so a class keeps its colour whatever is filtered. */
export function classColors(graph: DataModelGraph): Map<string, string> {
  const classes = graph.nodes
    .filter(node => node.kind === 'class')
    .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  return new Map(classes.map((node, index) => [node.id, CLASS_COLORS[index % CLASS_COLORS.length]]));
}

export interface GraphElementOptions {
  /** Colour per class; see `classColors`. */
  colors: Map<string, string>;
  mainIri?: string;
  selectedIri?: string;
  anyResourceLabel: string;
}

/**
 * The data model as Cytoscape elements: a node per class, an edge per link labelled with its property, a dashed
 * edge per subclass relation if the graph still has any. Each class node carries its colour; node classes carry what else the stylesheet
 * draws: `external`, `unlinked`, `main`, `selected`.
 */
export function toGraphElements(graph: DataModelGraph, options: GraphElementOptions): ElementDefinition[] {
  const linked = new Set(graph.edges.flatMap(edge => [edge.source, edge.target]));
  const nodes: ElementDefinition[] = graph.nodes.map(node => ({
    group: 'nodes',
    data: {
      id: node.id,
      label: node.kind === 'generic' && node.id === Constants.Resource ? options.anyResourceLabel : node.label,
      color: options.colors.get(node.id) ?? '#FFFFFF',
    },
    classes: [
      node.kind === 'class' ? '' : 'external',
      linked.has(node.id) ? '' : 'unlinked',
      node.id === options.mainIri ? 'main' : '',
      node.id === options.selectedIri ? 'selected' : '',
    ]
      .filter(Boolean)
      .join(' '),
  }));
  const edges: ElementDefinition[] = graph.edges
    .filter(edge => edge.source !== edge.target)
    .map(edge => ({
      group: 'edges',
      data: {
        id: `${edge.source} ${edge.property} ${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        property: edge.property,
      },
      classes: edge.kind,
    }));
  return [...nodes, ...edges];
}

/** Cytoscape layout options per layout; deterministic, so the same model always lands the same way. */
export function layoutOptions(layout: GraphLayout): { name: string } & Record<string, unknown> {
  switch (layout) {
    case 'tree':
      return { name: 'breadthfirst', directed: true, spacingFactor: 1.25, padding: 32, animate: false };
    case 'circle':
      return { name: 'circle', padding: 32, spacingFactor: 1.1, animate: false };
    case 'force':
      return {
        name: 'cose',
        padding: 32,
        animate: false,
        randomize: false,
        idealEdgeLength: () => 140,
        nodeRepulsion: () => 12000,
      };
    case 'grid':
      return { name: 'grid', padding: 32, avoidOverlap: true, animate: false };
  }
}

/**
 * The classes and every class they link to or are linked from, with only those links; the whole model when no class
 * of it is given. The arrows tell the two directions apart.
 */
export function linkedWith(graph: DataModelGraph, classIris: readonly string[]): DataModelGraph {
  const chosen = new Set(classIris.filter(iri => graph.nodes.some(node => node.id === iri)));
  if (chosen.size === 0) return graph;
  const edges = graph.edges.filter(
    edge => edge.source !== edge.target && (chosen.has(edge.target) || chosen.has(edge.source))
  );
  const kept = new Set([...chosen, ...edges.flatMap(edge => [edge.source, edge.target])]);
  return { nodes: graph.nodes.filter(node => kept.has(node.id)), edges };
}

/** Only the links through these properties, with the classes at both ends; the whole model when none is given. */
export function throughProperties(graph: DataModelGraph, propertyIris: readonly string[]): DataModelGraph {
  if (propertyIris.length === 0) return graph;
  const chosen = new Set(propertyIris);
  const edges = graph.edges.filter(
    edge => edge.kind === 'link' && edge.source !== edge.target && chosen.has(edge.property)
  );
  const kept = new Set(edges.flatMap(edge => [edge.source, edge.target]));
  return { nodes: graph.nodes.filter(node => kept.has(node.id)), edges };
}

/**
 * The data model with no subclass arrows; a subclass gets its superclasses' links instead, as it inherits them.
 * Classes outside the data model that only a subclass arrow brought in are left out.
 */
export function withInheritedLinks(graph: DataModelGraph): DataModelGraph {
  const { children, ancestors } = superclasses(graph);
  const links = graph.edges.filter(edge => edge.kind === 'link');
  const edges = new Map(links.map(edge => [`${edge.source} ${edge.property} ${edge.target}`, edge]));
  for (const child of children) {
    const inherited = ancestors(child);
    for (const edge of links) {
      if (!inherited.has(edge.source) || edge.target === child) continue;
      const key = `${child} ${edge.property} ${edge.target}`;
      if (!edges.has(key)) edges.set(key, { ...edge, source: child });
    }
  }
  const linked = new Set([...edges.values()].flatMap(edge => [edge.source, edge.target]));
  return {
    nodes: graph.nodes.filter(node => node.kind === 'class' || linked.has(node.id)),
    edges: [...edges.values()],
  };
}

/** The classes that have a superclass, and every superclass of a class, at any depth. */
function superclasses(graph: DataModelGraph): { children: string[]; ancestors: (iri: string) => Set<string> } {
  const parents = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.kind === 'subclass') parents.set(edge.source, [...(parents.get(edge.source) ?? []), edge.target]);
  }
  const ancestors = (iri: string, seen = new Set<string>()): Set<string> => {
    for (const parent of parents.get(iri) ?? []) {
      if (seen.has(parent)) continue;
      seen.add(parent);
      ancestors(parent, seen);
    }
    return seen;
  };
  return { children: [...parents.keys()], ancestors };
}

/** A class with a link property, for the property panel. */
export interface PropertyUser {
  classIri: string;
  /** How many values the class takes; unknown for a class outside the data model. */
  cardinality?: Cardinality;
  /** The superclass the class inherits the property from, if it does not declare it itself. */
  inheritedFrom?: string;
}

/** What the property panel shows of a link property. */
export interface PropertyUsage {
  label: string;
  description: string;
  /** The classes its links point at. */
  targets: string[];
  /** Its links between two different classes, as the graph draws them. */
  links: number;
  users: PropertyUser[];
}

/**
 * How a link property is used in the data model: the classes that have it, inherited ones included, and the classes it
 * points at; `undefined` when no class has it.
 */
export function propertyUsage(graph: DataModelGraph, propertyIri: string): PropertyUsage | undefined {
  const edges = withInheritedLinks(graph).edges.filter(edge => edge.property === propertyIri);
  if (edges.length === 0) return undefined;
  const declaring = new Set(
    graph.edges.filter(edge => edge.kind === 'link' && edge.property === propertyIri).map(edge => edge.source)
  );
  const { ancestors } = superclasses(graph);
  const details = (iri: string) =>
    graph.nodes.find(node => node.id === iri)?.propertyDetails?.find(property => property.id === propertyIri);
  const users = [...new Set(edges.map(edge => edge.source))].map(classIri => ({
    classIri,
    cardinality: details(classIri)?.cardinality,
    inheritedFrom: declaring.has(classIri) ? undefined : [...ancestors(classIri)].find(iri => declaring.has(iri)),
  }));
  return {
    label: edges[0].label,
    description: users.map(user => details(user.classIri)?.description).find(Boolean) ?? '',
    targets: [...new Set(edges.map(edge => edge.target))],
    links: edges.filter(edge => edge.source !== edge.target).length,
    users,
  };
}
