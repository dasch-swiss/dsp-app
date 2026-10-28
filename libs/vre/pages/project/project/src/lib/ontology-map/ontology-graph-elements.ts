import { Constants } from '@dasch-swiss/dsp-js';
import type { ElementDefinition } from 'cytoscape';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';
import { LinkTint } from '../sidenav/data-model-map/data-model-importance';

/** The layouts the graph view offers: a tree following the links, a circle, a force-directed spread, a grid. */
export type GraphLayout = 'tree' | 'circle' | 'force' | 'grid';

export interface GraphElementOptions {
  tints: Map<string, LinkTint>;
  mainIri?: string;
  selectedIri?: string;
  anyResourceLabel: string;
}

/**
 * The data model as Cytoscape elements: a node per class, an edge per link labelled with its property, a dashed
 * edge per subclass relation. Node classes carry what the stylesheet draws: `tint-0`…`tint-3`, `external`,
 * `unlinked`, `main`, `selected`.
 */
export function toGraphElements(graph: DataModelGraph, options: GraphElementOptions): ElementDefinition[] {
  const linked = new Set(graph.edges.flatMap(edge => [edge.source, edge.target]));
  const nodes: ElementDefinition[] = graph.nodes.map(node => ({
    group: 'nodes',
    data: {
      id: node.id,
      label: node.kind === 'generic' && node.id === Constants.Resource ? options.anyResourceLabel : node.label,
    },
    classes: [
      node.kind === 'class' ? `tint-${options.tints.get(node.id) ?? 0}` : 'external',
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
