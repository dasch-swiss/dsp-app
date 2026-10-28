import { Constants } from '@dasch-swiss/dsp-js';
import type { ElementDefinition } from 'cytoscape';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';

/** The layouts the graph view offers: a tree following the links, a circle, a force-directed spread, a grid. */
export type GraphLayout = 'tree' | 'circle' | 'force' | 'grid';

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
 * edge per subclass relation. Each class node carries its colour; node classes carry what else the stylesheet
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

/** The class and the classes that link to it, with only those links; the whole model when no class is given. */
export function pointingTo(graph: DataModelGraph, classIri: string | undefined): DataModelGraph {
  if (!classIri || !graph.nodes.some(node => node.id === classIri)) return graph;
  const edges = graph.edges.filter(edge => edge.target === classIri && edge.source !== classIri);
  const kept = new Set([classIri, ...edges.map(edge => edge.source)]);
  return { nodes: graph.nodes.filter(node => kept.has(node.id)), edges };
}
