import { Cardinality, Constants } from '@dasch-swiss/dsp-js';
import type { ElementDefinition } from 'cytoscape';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import {
  ClassFamily,
  familyColor,
  familyTint,
  familyHue,
  familyTexture,
  fileIconImage,
  islandsOf,
  textureImage,
  unlinkedOf,
} from './islands';

/**
 * The layouts the graph view offers: a tree following the links, a circle, a force-directed spread, a grid, and
 * islands of linked classes with their families together; see `islands.ts`.
 */
export type GraphLayout = 'tree' | 'circle' | 'force' | 'grid' | 'islands';

/** How big class names read on screen, whatever the number of classes. */
export type GraphSize = 'small' | 'normal' | 'large';

/** What classes and links are written with: their labels, their names (the end of their IRI), or both. */
export type GraphLabels = 'labels' | 'names' | 'both';

/** The end of an IRI: a class's or a property's name, such as `linkToVideo`. */
export const localNameOf = (iri: string) => iri.substring(Math.max(iri.lastIndexOf('#'), iri.lastIndexOf('/')) + 1);

/** On-screen size of class names, in px, per size setting. */
export const GRAPH_TEXT_SIZE: Record<GraphSize, number> = { small: 11, normal: 14, large: 18 };

/** Class names' font size at scale 1; boxes, text and lines are drawn at a multiple of it. */
export const BASE_FONT_SIZE = 15;

/** How far boxes, text and lines grow, at most, against the space the layout leaves between classes. */
const MAX_SCALE = 4;

/**
 * How much bigger than at scale 1 the graph draws boxes, text and lines, for class names to read at `textSize` px when
 * the graph is shown at `zoom`. A big data model, fitted at a low zoom, gets bigger boxes; a small one never shrinks.
 */
export function graphScale(textSize: number, zoom: number): number {
  return Math.min(MAX_SCALE, Math.max(1, textSize / (BASE_FONT_SIZE * zoom)));
}

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
  /** The word after the count on a link standing for several, as in "5 links". */
  linksLabel?: string;
  /** Set for the Islands view: classes are grouped in islands and families, and show the file they carry. */
  islands?: IslandElementOptions;
}

export interface IslandElementOptions {
  /** The family of every class of the data model; see `classFamilies`. */
  families: Map<string, ClassFamily>;
}

/**
 * The data model as Cytoscape elements: a node per class, an edge per link labelled with its property, a dashed
 * edge per subclass relation if the graph still has any. Each class node carries its colour; node classes carry what
 * else the stylesheet draws: `external`, `main`, `selected`. A class without links is drawn as any other. In the
 * Islands view, compound nodes group the classes: an `island` per group of linked classes, framed only when there
 * are several, and a `family` per class and its subclasses within it.
 */
export function toGraphElements(graph: DataModelGraph, options: GraphElementOptions): ElementDefinition[] {
  const islands = options.islands;
  const parents = islands ? islandParents(graph, islands) : undefined;
  const nodes: ElementDefinition[] = graph.nodes.map(node => {
    const family = islands?.families.get(node.id);
    const hue = family && familyHue(family.index);
    const texture = family && familyTexture(family.index);
    const icon = islands && hue ? fileIconImage(node.representationClass, hue.dark) : undefined;
    const label = node.kind === 'generic' && node.id === Constants.Resource ? options.anyResourceLabel : node.label;
    return {
      group: 'nodes',
      data: {
        id: node.id,
        ...texts(label, node.id),
        color: family ? familyColor(family) : (options.colors.get(node.id) ?? '#FFFFFF'),
        ...(hue && texture ? { dark: hue.dark, texture: textureImage(texture, hue.dark, family.sub), icon } : {}),
        ...(parents?.get(node.id) ? { parent: parents.get(node.id) } : {}),
      },
      classes: [
        node.kind === 'class' ? '' : 'external',
        node.id === options.mainIri ? 'main' : '',
        node.id === options.selectedIri ? 'selected' : '',
        family ? (family.sub ? 'family-member sub' : 'family-member') : '',
        texture?.double ? 'double' : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  });
  if (parents) nodes.unshift(...islandNodes(graph, islands!));
  // A link to or from a class in a family is drawn over the family frames, which hide the links that only pass them.
  const inFamily = (iri: string) => !!parents?.get(iri)?.startsWith(FAMILY_PREFIX);
  const familyLink = (edge: { source: string; target: string }) => inFamily(edge.source) || inFamily(edge.target);
  // More than a few links from one class to another are drawn as one, which says how many they are.
  const drawn = graph.edges.filter(edge => edge.source !== edge.target);
  const between = new Map<string, number>();
  for (const edge of drawn) {
    if (edge.kind === 'link')
      between.set(`${edge.source}\n${edge.target}`, (between.get(`${edge.source}\n${edge.target}`) ?? 0) + 1);
  }
  const merged = new Set<string>();
  const edges: ElementDefinition[] = drawn.flatMap(edge => {
    const pair = `${edge.source}\n${edge.target}`;
    const count = edge.kind === 'link' ? (between.get(pair) ?? 0) : 0;
    if (count <= MAX_PARALLEL_LINKS) {
      return [
        {
          group: 'edges',
          data: {
            id: `${edge.source} ${edge.property} ${edge.target}`,
            source: edge.source,
            target: edge.target,
            ...texts(edge.label, edge.property),
            property: edge.property,
          },
          classes: [edge.kind, familyLink(edge) ? 'family-link' : ''].filter(Boolean).join(' '),
        },
      ];
    }
    if (merged.has(pair)) return [];
    merged.add(pair);
    const label = `${count} ${options.linksLabel ?? 'links'}`;
    return [
      {
        group: 'edges',
        data: {
          id: `${edge.source} links ${edge.target}`,
          source: edge.source,
          target: edge.target,
          label,
          name: label,
          both: label,
        },
        classes: ['links', familyLink(edge) ? 'family-link' : ''].filter(Boolean).join(' '),
      },
    ];
  });
  return [...nodes, ...edges];
}

/** How many links from one class to another are drawn one by one; more are drawn as one. */
export const MAX_PARALLEL_LINKS = 4;

/** An element's texts, one per `GraphLabels`: its label, its name, and both on two lines. */
function texts(label: string, iri: string): { label: string; name: string; both: string } {
  const name = localNameOf(iri);
  return { label, name, both: `${label}\n${name}` };
}

const islandId = (index: number) => `island:${index}`;
const UNLINKED_ISLAND = 'island:unlinked';
const FAMILY_PREFIX = 'family:';
const familyId = (island: string, root: string) => `${FAMILY_PREFIX}${island}:${root}`;

/**
 * The islands of the Islands view, each listing its classes; the unlinked classes last, as one island. A subclass
 * counts as linked with the top class of its family, so a family stays in one island, links or not.
 */
function islandGroups(graph: DataModelGraph, families: Map<string, ClassFamily>): { id: string; iris: string[] }[] {
  const shown = new Set(graph.nodes.map(node => node.id));
  const familyEdges = graph.nodes.flatMap(node => {
    const root = families.get(node.id)?.root;
    return root && root !== node.id && shown.has(root)
      ? [{ source: node.id, target: root, property: 'family', label: '', kind: 'subclass' as const }]
      : [];
  });
  const grouped = { nodes: graph.nodes, edges: [...graph.edges, ...familyEdges] };
  const groups = islandsOf(grouped).map((iris, index) => ({ id: islandId(index), iris }));
  const unlinked = unlinkedOf(grouped);
  return unlinked.length ? [...groups, { id: UNLINKED_ISLAND, iris: unlinked }] : groups;
}

/** The compound node each class sits in: its family's, if more of its family share its island, else its island's. */
function islandParents(graph: DataModelGraph, options: IslandElementOptions): Map<string, string> {
  const parents = new Map<string, string>();
  for (const { id, iris } of islandGroups(graph, options.families)) {
    const roots = iris.map(iri => options.families.get(iri)?.root);
    iris.forEach((iri, i) => {
      const root = roots[i];
      const shared = root !== undefined && roots.filter(other => other === root).length > 1;
      parents.set(iri, shared ? familyId(id, root) : id);
    });
  }
  return parents;
}

/**
 * The compound nodes of the Islands view, all unnamed: an island per group of linked classes, and a family per shared
 * family. A lone island, or one of a single class, is kept for the layout, but `alone`: drawn without a frame, even
 * when hovered.
 */
function islandNodes(graph: DataModelGraph, options: IslandElementOptions): ElementDefinition[] {
  const parents = islandParents(graph, options);
  const groups = islandGroups(graph, options.families);
  const elements: ElementDefinition[] = [];
  for (const { id, iris } of groups) {
    elements.push({
      group: 'nodes',
      data: { id, label: '', name: '', both: '' },
      classes: [
        'island',
        id === UNLINKED_ISLAND ? 'unlinked' : '',
        groups.length === 1 || iris.length === 1 ? 'alone' : '',
      ]
        .filter(Boolean)
        .join(' '),
    });
    for (const parent of new Set(iris.map(iri => parents.get(iri)).filter(p => p && p !== id))) {
      const family = options.families.get(iris.find(iri => parents.get(iri) === parent)!)!;
      const hue = familyHue(family.index);
      elements.push({
        group: 'nodes',
        data: {
          id: parent!,
          parent: id,
          // A family's frame and hue group its classes; it is not named.
          label: '',
          name: '',
          both: '',
          tint: familyTint(hue.base),
          dark: hue.dark,
        },
        classes: 'family',
      });
    }
  }
  return elements;
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
    case 'islands':
      // Laid out island by island; see `arrangeIslands`.
      return { name: 'preset', fit: false, animate: false };
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
 * The data model with no subclass arrows; a subclass gets its superclasses' links instead, as it inherits them, unless
 * `inherit` is false. Classes outside the data model that only a subclass arrow brought in are left out.
 */
export function withInheritedLinks(graph: DataModelGraph, inherit = true): DataModelGraph {
  const { children, ancestors } = superclasses(graph);
  const links = graph.edges.filter(edge => edge.kind === 'link');
  const edges = new Map(links.map(edge => [`${edge.source} ${edge.property} ${edge.target}`, edge]));
  for (const child of inherit ? children : []) {
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

/** A class with a property, for the property panel. */
export interface PropertyUser {
  classIri: string;
  /** How many values the class takes; unknown for a class outside the data model. */
  cardinality?: Cardinality;
  /** The superclass the class inherits the property from, if it does not declare it itself. */
  inheritedFrom?: string;
}

/** What the property panel shows of a property. */
export interface PropertyUsage {
  label: string;
  description: string;
  /** The value type, as `DataModelProperty.type` names it: `Link` for a link. */
  type: string;
  /** The classes a link points at; none for other properties. */
  targets: string[];
  /** Its links between two different classes, as the graph draws them. */
  links: number;
  users: PropertyUser[];
}

/**
 * How a property is used in the data model: the classes that have it, inherited ones included, and for a link the
 * classes it points at; `undefined` when no class has it.
 */
export function propertyUsage(graph: DataModelGraph, propertyIri: string): PropertyUsage | undefined {
  const edges = withInheritedLinks(graph).edges.filter(edge => edge.property === propertyIri);
  const details = (iri: string) =>
    graph.nodes.find(node => node.id === iri)?.propertyDetails?.find(property => property.id === propertyIri);
  const withDetails = graph.nodes.filter(node => details(node.id)).map(node => node.id);
  const userIris = [...new Set([...edges.map(edge => edge.source), ...withDetails])];
  if (userIris.length === 0) return undefined;
  const having = new Set(userIris);
  const { ancestors } = superclasses(graph);
  const users = userIris.map(classIri => ({
    classIri,
    cardinality: details(classIri)?.cardinality,
    inheritedFrom: [...ancestors(classIri)].find(iri => having.has(iri)),
  }));
  const detail = userIris.map(details).find(Boolean);
  return {
    label: detail?.label ?? edges[0].label,
    description: userIris.map(iri => details(iri)?.description).find(Boolean) ?? '',
    type: detail?.type ?? 'Link',
    targets: [...new Set([...edges.map(edge => edge.target), ...(detail?.linkTarget ? [detail.linkTarget] : [])])],
    links: edges.filter(edge => edge.source !== edge.target).length,
    users,
  };
}

/** One class of the data model, as the Classes table lists it. */
export interface ClassRow {
  id: string;
  label: string;
  name: string;
  /** How many properties it has, inherited ones included. */
  properties: number;
  /** The classes it links to, each once, its superclasses' links included. */
  linksTo: string[];
}

/** The classes of the data model, by label, for the Classes table. */
export function classRows(graph: DataModelGraph): ClassRow[] {
  const edges = withInheritedLinks(graph).edges;
  return graph.nodes
    .filter(node => node.kind === 'class')
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(node => ({
      id: node.id,
      label: node.label,
      name: localNameOf(node.id),
      properties: node.propertyDetails?.length ?? 0,
      linksTo: [
        ...new Set(edges.filter(edge => edge.source === node.id && edge.target !== node.id).map(edge => edge.target)),
      ],
    }));
}

/** One property of the data model, as the Properties table lists it. */
export interface PropertyRow {
  id: string;
  label: string;
  name: string;
  type: string;
  /** The class a link points at; only set for links. */
  linkTarget?: string;
  /** The classes that have it, inherited ones included, by label. */
  usedBy: string[];
}

/** Every property the classes of the data model have, each once, by label, for the Properties table. */
export function propertyRows(graph: DataModelGraph): PropertyRow[] {
  const rows = new Map<string, PropertyRow>();
  const classes = graph.nodes.filter(node => node.kind === 'class').sort((a, b) => a.label.localeCompare(b.label));
  for (const node of classes) {
    for (const property of node.propertyDetails ?? []) {
      const row = rows.get(property.id) ?? {
        id: property.id,
        label: property.label,
        name: localNameOf(property.id),
        type: property.type,
        linkTarget: property.linkTarget,
        usedBy: [],
      };
      row.usedBy.push(node.id);
      rows.set(property.id, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.label.localeCompare(b.label) || a.name.localeCompare(b.name));
}

/** The data model without these classes and their links. */
export function withoutClasses(graph: DataModelGraph, classIris: readonly string[]): DataModelGraph {
  const hidden = new Set(classIris);
  return {
    nodes: graph.nodes.filter(node => !hidden.has(node.id)),
    edges: graph.edges.filter(edge => !hidden.has(edge.source) && !hidden.has(edge.target)),
  };
}

/** The data model without the links through these properties; every class stays. */
export function withoutProperties(graph: DataModelGraph, propertyIris: readonly string[]): DataModelGraph {
  const hidden = new Set(propertyIris);
  return { nodes: graph.nodes, edges: graph.edges.filter(edge => !hidden.has(edge.property)) };
}
