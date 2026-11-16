import { DataModelEdge, DataModelGraph, DataModelNode } from './data-model-graph';

export interface PlacedNode {
  node: DataModelNode;
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
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

/** Side margins; links that skip rows may run down them. */
const MARGIN = 10;
/** Space between two cards of a row. */
const GAP = 16;
const PADDING_Y = 8;
const CARD = {
  full: { height: 48, rowGap: 18, lane: 5 },
  condensed: { height: 22, rowGap: 12, lane: 3 },
};
/** Room under a row before the first lane, for links that leave the row to skip rows. */
const STUB = 4;
/** Room above a card after the last lane, so links visibly drop into it. */
const DROP = 6;

/** How many cards fit in a row of `width`. */
export const columnsFor = (width: number) => (width >= 260 ? 3 : 2);

const byLabel = (a: DataModelNode, b: DataModelNode) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id);

/**
 * Lays a data model out in rows, links running top to bottom: classes that only link out at the top, the classes
 * they point at further down. A step that has more classes than fit wraps onto further rows. Two steps share a row
 * when they fit side by side and only one pair of classes links them, drawn as a short line between the two cards.
 * Every other link enters its target from above through a horizontal lane in the gap over the target's row, shared
 * by all links into that target through the same property, so they bundle into one trunk; a link that skips rows
 * or runs upwards goes down a free channel between the cards first. Classes without any link fill a grid below.
 * Deterministic: the same graph and width always give the same layout.
 */
export function layoutDataModel(
  graph: DataModelGraph,
  {
    width,
    condensed,
    perRow = columnsFor(width),
    heightOf,
  }: {
    width: number;
    condensed: boolean;
    perRow?: number;
    /** A card's height, when cards are not all as tall; a row is as tall as its tallest card. */
    heightOf?: (node: DataModelNode) => number;
  }
): DataModelLayout {
  const card = condensed ? CARD.condensed : CARD.full;
  const cardHeight = (node: DataModelNode) => heightOf?.(node) ?? card.height;
  const edges = graph.edges.filter(edge => edge.source !== edge.target);
  const linkedIds = new Set(edges.flatMap(edge => [edge.source, edge.target]));
  const linked = graph.nodes.filter(node => linkedIds.has(node.id)).sort(byLabel);
  const unlinked = graph.nodes.filter(node => !linkedIds.has(node.id)).sort(byLabel);

  const rank = rankNodes(linked, edges);
  const levels: DataModelNode[][] = [];
  for (const node of linked) {
    (levels[rank.get(node.id)!] ??= []).push(node);
  }
  orderLevels(levels, edges);
  const rows = packRows(levels, edges, perRow);

  const cardWidth = (width - 2 * MARGIN - (perRow - 1) * GAP) / perRow;
  const rowOf = new Map<string, number>();
  rows.forEach((row, index) => row.forEach(node => rowOf.set(node.id, index)));
  const sameRow = (edge: DataModelEdge) => rowOf.get(edge.source) === rowOf.get(edge.target);

  // The lanes in the gap over each row, one per trunk, ordered left to right by where they drop.
  const trunkKey = (edge: DataModelEdge) => `${edge.target} ${edge.property}`;
  const trunksByRow = rows.map(() => [] as string[]);
  const trunksByTarget = new Map<string, string[]>();
  for (const edge of edges.filter(e => !sameRow(e))) {
    const key = trunkKey(edge);
    const trunks = trunksByRow[rowOf.get(edge.target)!];
    if (!trunks.includes(key)) trunks.push(key);
    const own = trunksByTarget.get(edge.target) ?? [];
    if (!own.includes(key)) trunksByTarget.set(edge.target, [...own, key]);
  }
  const gapOver = (row: number) => {
    const lanes = trunksByRow[row].length;
    if (lanes === 0) return row === 0 ? 0 : card.rowGap;
    return Math.max(card.rowGap, STUB + lanes * card.lane + DROP);
  };

  const placed = new Map<string, PlacedNode>();
  const rowTop: number[] = [];
  let y = PADDING_Y;
  rows.forEach((row, index) => {
    y += gapOver(index);
    rowTop.push(y);
    const rowWidth = row.length * cardWidth + (row.length - 1) * GAP;
    const left = (width - rowWidth) / 2;
    row.forEach((node, i) =>
      placed.set(node.id, {
        node,
        x: left + i * (cardWidth + GAP),
        y,
        width: cardWidth,
        height: cardHeight(node),
        row: index,
      })
    );
    y += Math.max(...row.map(cardHeight));
  });

  let gridY = y + (rows.length > 0 && unlinked.length > 0 ? card.rowGap : 0);
  for (let start = 0; start < unlinked.length; start += perRow) {
    const gridRow = unlinked.slice(start, start + perRow);
    gridRow.forEach((node, column) => {
      placed.set(node.id, {
        node,
        x: MARGIN + column * (cardWidth + GAP),
        y: gridY,
        width: cardWidth,
        height: cardHeight(node),
        row: rows.length + start / perRow,
      });
    });
    gridY += Math.max(...gridRow.map(cardHeight)) + card.rowGap;
  }

  const laneY = (target: PlacedNode, key: string) => {
    const trunks = trunksByRow[target.row];
    return target.y - DROP - (trunks.length - 1 - trunks.indexOf(key)) * card.lane - card.lane / 2;
  };
  const dropX = (target: PlacedNode, key: string) => {
    const own = trunksByTarget.get(target.node.id)!;
    return target.x + (target.width * (own.indexOf(key) + 1)) / (own.length + 1);
  };
  const cards = [...placed.values()];

  const routed = edges.map(edge => {
    const source = placed.get(edge.source)!;
    const target = placed.get(edge.target)!;
    if (sameRow(edge)) {
      const middle = round(source.y + source.height / 2);
      return { edge, path: `M ${round(source.x + source.width)} ${middle} H ${round(target.x)}` };
    }
    const key = trunkKey(edge);
    const startX = round(source.x + source.width / 2);
    const bottom = round(source.y + source.height);
    const lane = round(laneY(target, key));
    const end = `H ${round(dropX(target, key))} V ${round(target.y)}`;
    if (target.row === source.row + 1) {
      return { edge, path: `M ${startX} ${bottom} V ${lane} ${end}` };
    }
    // Skipping rows or running upwards: down a channel between the cards of the rows it passes.
    const passed = cards.filter(p =>
      target.row > source.row ? p.row > source.row && p.row < target.row : p.row >= target.row && p.row <= source.row
    );
    const channel = round(freeChannel(source.x + source.width / 2, passed, width));
    const stub = round(source.y + source.height + STUB / 2);
    return { edge, path: `M ${startX} ${bottom} V ${stub} H ${channel} V ${lane} ${end}` };
  });

  const nodes = [...placed.values()];
  const height = nodes.length === 0 ? 0 : Math.max(...nodes.map(p => p.y + p.height)) + PADDING_Y;
  return { nodes, edges: routed, width, height };
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

/** Barycenter ordering: each class moves towards the positions of the classes it is linked with. */
function orderLevels(levels: DataModelNode[][], edges: DataModelEdge[]) {
  const neighbours = new Map<string, string[]>();
  for (const { source, target } of edges) {
    neighbours.set(source, [...(neighbours.get(source) ?? []), target]);
    neighbours.set(target, [...(neighbours.get(target) ?? []), source]);
  }
  const positionOf = new Map<string, number>();
  const levelOf = new Map<string, number>();
  const remember = () =>
    levels.forEach((level, l) =>
      level.forEach((node, i) => {
        positionOf.set(node.id, i - level.length / 2);
        levelOf.set(node.id, l);
      })
    );
  remember();

  const sweep = (l: number, fromAbove: boolean) => {
    const weight = (node: DataModelNode) => {
      const positions = (neighbours.get(node.id) ?? [])
        .filter(id => (fromAbove ? levelOf.get(id)! < l : levelOf.get(id)! > l))
        .map(id => positionOf.get(id)!);
      return positions.length > 0
        ? positions.reduce((sum, p) => sum + p, 0) / positions.length
        : positionOf.get(node.id)!;
    };
    const weights = new Map(levels[l].map(node => [node.id, weight(node)]));
    levels[l].sort((a, b) => weights.get(a.id)! - weights.get(b.id)! || byLabel(a, b));
    remember();
  };
  for (let round = 0; round < 2; round++) {
    for (let l = 1; l < levels.length; l++) sweep(l, true);
    for (let l = levels.length - 2; l >= 0; l--) sweep(l, false);
  }
}

/**
 * Rows from the levels: a level and the next share a row when they fit side by side and all links between them join
 * one pair of classes, placed next to each other; a level with more classes than fit a row wraps onto further rows.
 */
function packRows(levels: DataModelNode[][], edges: DataModelEdge[], perRow: number): DataModelNode[][] {
  const rows: DataModelNode[][] = [];
  for (let l = 0; l < levels.length; l++) {
    const level = levels[l];
    const next = levels[l + 1];
    if (next && level.length + next.length <= perRow) {
      const inLevel = new Set(level.map(node => node.id));
      const inNext = new Set(next.map(node => node.id));
      const between = edges.filter(
        e => (inLevel.has(e.source) && inNext.has(e.target)) || (inNext.has(e.source) && inLevel.has(e.target))
      );
      const pairs = new Set(between.map(e => `${e.source} ${e.target}`));
      if (pairs.size === 1 && inLevel.has(between[0].source)) {
        const { source, target } = between[0];
        rows.push([
          ...level.filter(node => node.id !== source),
          level.find(node => node.id === source)!,
          next.find(node => node.id === target)!,
          ...next.filter(node => node.id !== target),
        ]);
        l++;
        continue;
      }
    }
    for (let i = 0; i < level.length; i += perRow) {
      rows.push(level.slice(i, i + perRow));
    }
  }
  return rows;
}

/** The x closest to `x` at which a vertical line crosses none of `cards`: a gap between cards, or a side margin. */
function freeChannel(x: number, cards: PlacedNode[], width: number): number {
  const clear = (at: number) => cards.every(p => at < p.x - 1 || at > p.x + p.width + 1);
  const candidates = [
    MARGIN / 2,
    width - MARGIN / 2,
    ...cards.flatMap(p => [p.x - GAP / 2, p.x + p.width + GAP / 2]),
  ].filter(at => at > 0 && at < width && clear(at));
  return candidates.sort((a, b) => Math.abs(a - x) - Math.abs(b - x) || a - b)[0] ?? MARGIN / 2;
}

const round = (value: number) => Math.round(value * 10) / 10;
