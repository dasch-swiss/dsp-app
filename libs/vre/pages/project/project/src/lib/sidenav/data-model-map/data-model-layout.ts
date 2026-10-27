import { DataModelEdge, DataModelGraph, DataModelNode } from './data-model-graph';

export interface PlacedNode {
  node: DataModelNode;
  x: number;
  y: number;
  width: number;
  height: number;
  column: number;
}

export interface RoutedEdge {
  edge: DataModelEdge;
  /** SVG path data, in the same coordinates as the nodes. */
  path: string;
}

export interface DataModelLayout {
  nodes: PlacedNode[];
  edges: RoutedEdge[];
  width: number;
  height: number;
}

/** Side margins; the left one carries the lanes of links into the first column. */
const MARGIN = 10;
/** Space between columns, where the lanes of links into the next column run. */
const GAP = 16;
const PADDING_Y = 8;
const CARD = {
  full: { height: 48, pitch: 60 },
  condensed: { height: 22, pitch: 26 },
};

/** How many columns of cards fit `width`. */
export const columnsFor = (width: number) => (width >= 260 ? 3 : 2);

const byLabel = (a: DataModelNode, b: DataModelNode) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id);

/**
 * Lays a data model out in columns, links running left to right: classes that only link out on the left, the classes
 * they point at further right. Every link enters its target from the left through a vertical lane in the gap before
 * the target's column, shared by all links into that target through the same property, so they bundle into one trunk.
 * Classes without any link fill a grid below. Deterministic: the same graph and width always give the same layout.
 */
export function layoutDataModel(
  graph: DataModelGraph,
  { width, condensed }: { width: number; condensed: boolean }
): DataModelLayout {
  const card = condensed ? CARD.condensed : CARD.full;
  const edges = graph.edges.filter(edge => edge.source !== edge.target);
  const linkedIds = new Set(edges.flatMap(edge => [edge.source, edge.target]));
  const linked = graph.nodes.filter(node => linkedIds.has(node.id)).sort(byLabel);
  const unlinked = graph.nodes.filter(node => !linkedIds.has(node.id)).sort(byLabel);

  const maxColumns = columnsFor(width);
  const columnOf = balanceColumns(linked, edges, rankNodes(linked, edges), maxColumns);
  const columnCount = Math.max(0, ...columnOf.values()) + 1;
  const columns: DataModelNode[][] = Array.from({ length: columnCount }, () => []);
  for (const node of linked) {
    columns[columnOf.get(node.id)!].push(node);
  }
  orderColumns(columns, edges);

  const placed = new Map<string, PlacedNode>();
  const cardWidth = (columnsOf: number) => (width - 2 * MARGIN - (columnsOf - 1) * GAP) / columnsOf;
  const columnX = (column: number, columnsOf: number) => MARGIN + column * (cardWidth(columnsOf) + GAP);
  const tallest = Math.max(0, ...columns.map(column => column.length));
  columns.forEach((column, index) => {
    const offset = ((tallest - column.length) * card.pitch) / 2;
    column.forEach((node, row) => {
      placed.set(node.id, {
        node,
        x: columnX(index, columnCount),
        y: PADDING_Y + offset + row * card.pitch,
        width: cardWidth(columnCount),
        height: card.height,
        column: index,
      });
    });
  });

  const gridTop =
    PADDING_Y + tallest * card.pitch + (tallest > 0 && unlinked.length > 0 ? card.pitch - card.height : 0);
  unlinked.forEach((node, index) => {
    const column = index % maxColumns;
    placed.set(node.id, {
      node,
      x: columnX(column, maxColumns),
      y: gridTop + Math.floor(index / maxColumns) * card.pitch,
      width: cardWidth(maxColumns),
      height: card.height,
      column,
    });
  });

  const nodes = [...placed.values()];
  const height = nodes.length === 0 ? 0 : Math.max(...nodes.map(p => p.y + p.height)) + PADDING_Y;
  return { nodes, edges: routeEdges(edges, placed), width, height };
}

/** Longest path from a class nothing links to; links that close a cycle are left out of the ranking. */
function rankNodes(nodes: DataModelNode[], edges: DataModelEdge[]): Map<string, number> {
  const outgoing = new Map<string, string[]>(nodes.map(node => [node.id, []]));
  for (const edge of edges) {
    outgoing.get(edge.source)!.push(edge.target);
  }

  const forward: [string, string][] = [];
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string) => {
    state.set(id, 'open');
    for (const target of outgoing.get(id)!) {
      if (state.get(target) === 'open') continue;
      forward.push([id, target]);
      if (!state.has(target)) visit(target);
    }
    state.set(id, 'done');
  };
  nodes.forEach(node => state.has(node.id) || visit(node.id));

  const rank = new Map<string, number>(nodes.map(node => [node.id, 0]));
  const incoming = new Map<string, number>(nodes.map(node => [node.id, 0]));
  forward.forEach(([, target]) => incoming.set(target, incoming.get(target)! + 1));
  const ready = nodes.filter(node => incoming.get(node.id) === 0).map(node => node.id);
  while (ready.length > 0) {
    const id = ready.shift()!;
    for (const [source, target] of forward) {
      if (source !== id) continue;
      rank.set(target, Math.max(rank.get(target)!, rank.get(id)! + 1));
      incoming.set(target, incoming.get(target)! - 1);
      if (incoming.get(target) === 0) ready.push(target);
    }
  }
  return rank;
}

/**
 * Columns from ranks, ranks past the last column folded into it; then a column taller than its share moves classes
 * one column right, as long as everything they link to stays further right, so links still run left to right.
 */
function balanceColumns(
  nodes: DataModelNode[],
  edges: DataModelEdge[],
  rank: Map<string, number>,
  maxColumns: number
): Map<string, number> {
  const columnOf = new Map(nodes.map(node => [node.id, Math.min(rank.get(node.id)!, maxColumns - 1)]));
  const share = Math.ceil(nodes.length / maxColumns);
  const canMoveRight = (id: string, to: number) =>
    edges.every(edge => edge.source !== id || edge.target === id || columnOf.get(edge.target)! > to);

  for (let c = maxColumns - 2; c >= 0; c--) {
    const column = nodes.filter(node => columnOf.get(node.id) === c);
    for (const node of [...column].reverse()) {
      if (column.length <= share) break;
      if (canMoveRight(node.id, c + 1)) {
        columnOf.set(node.id, c + 1);
        column.splice(column.indexOf(node), 1);
      }
    }
  }
  return columnOf;
}

/** Barycenter ordering: each class moves towards the rows of the classes it is linked with. */
function orderColumns(columns: DataModelNode[][], edges: DataModelEdge[]) {
  const neighbours = new Map<string, string[]>();
  for (const { source, target } of edges) {
    neighbours.set(source, [...(neighbours.get(source) ?? []), target]);
    neighbours.set(target, [...(neighbours.get(target) ?? []), source]);
  }
  const rowOf = new Map<string, number>();
  const columnOf = new Map<string, number>();
  const remember = () =>
    columns.forEach((column, c) =>
      column.forEach((node, row) => {
        rowOf.set(node.id, row - column.length / 2);
        columnOf.set(node.id, c);
      })
    );
  remember();

  const sweep = (c: number, fromLeft: boolean) => {
    const weight = (node: DataModelNode) => {
      const rows = (neighbours.get(node.id) ?? [])
        .filter(id => (fromLeft ? columnOf.get(id)! < c : columnOf.get(id)! > c))
        .map(id => rowOf.get(id)!);
      return rows.length > 0 ? rows.reduce((sum, row) => sum + row, 0) / rows.length : rowOf.get(node.id)!;
    };
    const weights = new Map(columns[c].map(node => [node.id, weight(node)]));
    columns[c].sort((a, b) => weights.get(a.id)! - weights.get(b.id)! || byLabel(a, b));
    remember();
  };
  for (let round = 0; round < 2; round++) {
    for (let c = 1; c < columns.length; c++) sweep(c, true);
    for (let c = columns.length - 2; c >= 0; c--) sweep(c, false);
  }
}

function routeEdges(edges: DataModelEdge[], placed: Map<string, PlacedNode>): RoutedEdge[] {
  const middle = (p: PlacedNode) => p.y + p.height / 2;
  const trunkKey = (edge: DataModelEdge) => `${edge.target} ${edge.property}`;

  // The lanes in the gap left of each column, one per trunk, ordered by the height of their target.
  const trunksByColumn = new Map<number, string[]>();
  for (const edge of [...edges].sort((a, b) => middle(placed.get(a.target)!) - middle(placed.get(b.target)!))) {
    const column = placed.get(edge.target)!.column;
    const trunks = trunksByColumn.get(column) ?? [];
    if (!trunks.includes(trunkKey(edge))) trunks.push(trunkKey(edge));
    trunksByColumn.set(column, trunks);
  }
  const laneX = (target: PlacedNode, key: string) => {
    const trunks = trunksByColumn.get(target.column)!;
    const gapStart = target.column === 0 ? 0 : target.x - GAP;
    const gapWidth = target.column === 0 ? MARGIN : GAP;
    return gapStart + (gapWidth * (trunks.indexOf(key) + 1)) / (trunks.length + 1);
  };

  return edges.map(edge => {
    const source = placed.get(edge.source)!;
    const target = placed.get(edge.target)!;
    const startX = source.column < target.column ? source.x + source.width : source.x;
    const lane = round(laneX(target, trunkKey(edge)));
    return {
      edge,
      path: `M ${round(startX)} ${round(middle(source))} H ${lane} V ${round(middle(target))} H ${round(target.x)}`,
    };
  });
}

const round = (value: number) => Math.round(value * 10) / 10;
