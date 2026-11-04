import type { RepresentationClass } from '@dasch-swiss/vre/3rd-party-services/open-api';
import type { Core, EdgeSingular, NodeSingular } from 'cytoscape';
import { DataModelGraph } from '../sidenav/data-model-map/data-model-graph';

/**
 * The Islands view: classes linked together form an island, set apart from the others; a class and its subclasses
 * form a family, kept together inside its island and drawn in one hue, the parent in full colour and its subclasses
 * lighter. Ten hues, then the same hues in five more looks (see `TEXTURES`), so up to 60 families look different.
 */

/** Per hue: the parent's fill, the subclasses' lighter fill, and a dark shade for borders, textures and icons. */
export const FAMILY_HUES: readonly { base: string; light: string; dark: string }[] = [
  { base: '#A9CBEA', light: '#DCEAF7', dark: '#2F6A9A' },
  { base: '#F6BC86', light: '#FCE2C9', dark: '#A85A16' },
  { base: '#AEDBA6', light: '#DCF0D8', dark: '#3B7A33' },
  { base: '#C8B9E6', light: '#E7E0F5', dark: '#5B4796' },
  { base: '#F2AAAA', light: '#FAD9D9', dark: '#A23B3B' },
  { base: '#99D5CF', light: '#D2EDEA', dark: '#24766F' },
  { base: '#F1DC8A', light: '#F9EFC8', dark: '#7F6812' },
  { base: '#E9AED5', light: '#F6DBEC', dark: '#963A77' },
  { base: '#C3CCD6', light: '#E6EAEF', dark: '#4A5868' },
  { base: '#CFD98F', light: '#EDF1D2', dark: '#5E6B1C' },
];

/** What is drawn over a family's hue: stripes, dark or white, and whether its boxes have a double border. */
export interface FamilyTexture {
  stripes?: 'dark' | 'white';
  double: boolean;
}

/**
 * The looks, ten families each: plain, then white stripes, dark stripes, and plain, dark and white stripes again with a
 * double border.
 */
const TEXTURES: FamilyTexture[] = [
  { double: false },
  { stripes: 'white', double: false },
  { stripes: 'dark', double: false },
  { double: true },
  { stripes: 'dark', double: true },
  { stripes: 'white', double: true },
];

/** A class's family: the class at its top, and how it looks. */
export interface ClassFamily {
  /** IRI of the family's top class, which has no superclass in the data model. */
  root: string;
  /** The family's place, biggest families first; it picks the hue and the texture. */
  index: number;
  /** Whether the class is a subclass, drawn lighter than the top class. */
  sub: boolean;
  /** The top class's label, which names the family. */
  rootLabel: string;
}

export const familyHue = (index: number) => FAMILY_HUES[index % FAMILY_HUES.length];
export const familyTexture = (index: number): FamilyTexture =>
  TEXTURES[Math.floor(index / FAMILY_HUES.length) % TEXTURES.length];

/** A class's fill in the Islands view: its family's hue, lighter for a subclass. */
export const familyColor = (family: ClassFamily) =>
  family.sub ? familyHue(family.index).light : familyHue(family.index).base;

/**
 * The family of every class of the data model, from its subclass relations: a class belongs to the family of its
 * topmost superclass within the data model (the first one, when it has several). Families are ordered biggest first,
 * then by their top class's label, so the biggest get the plain hues.
 */
export function classFamilies(graph: DataModelGraph): Map<string, ClassFamily> {
  const classes = graph.nodes.filter(node => node.kind === 'class');
  const inModel = new Set(classes.map(node => node.id));
  const parentOf = new Map<string, string>();
  for (const edge of graph.edges) {
    if (edge.kind === 'subclass' && inModel.has(edge.target) && !parentOf.has(edge.source)) {
      parentOf.set(edge.source, edge.target);
    }
  }
  const rootOf = (iri: string) => {
    const seen = new Set([iri]);
    let root = iri;
    for (let parent = parentOf.get(root); parent && !seen.has(parent); parent = parentOf.get(root)) {
      seen.add(parent);
      root = parent;
    }
    return root;
  };
  const members = new Map<string, string[]>();
  for (const node of classes) {
    const root = rootOf(node.id);
    members.set(root, [...(members.get(root) ?? []), node.id]);
  }
  const labelOf = new Map(classes.map(node => [node.id, node.label]));
  const roots = [...members.keys()].sort(
    (a, b) =>
      members.get(b)!.length - members.get(a)!.length || (labelOf.get(a) ?? '').localeCompare(labelOf.get(b) ?? '')
  );
  const families = new Map<string, ClassFamily>();
  roots.forEach((root, index) => {
    for (const iri of members.get(root)!) {
      families.set(iri, { root, index, sub: iri !== root, rootLabel: labelOf.get(root) ?? '' });
    }
  });
  return families;
}

/**
 * The islands of a graph: its classes split into groups linked together, biggest first, each listing its classes'
 * IRIs. Classes linked with no other class are left out; see `unlinkedOf`.
 */
export function islandsOf(graph: DataModelGraph): string[][] {
  const neighbours = new Map<string, string[]>(graph.nodes.map(node => [node.id, []]));
  for (const edge of graph.edges) {
    if (edge.source === edge.target || !neighbours.has(edge.source) || !neighbours.has(edge.target)) continue;
    neighbours.get(edge.source)!.push(edge.target);
    neighbours.get(edge.target)!.push(edge.source);
  }
  const seen = new Set<string>();
  const islands: string[][] = [];
  for (const node of graph.nodes) {
    if (seen.has(node.id) || neighbours.get(node.id)!.length === 0) continue;
    const island: string[] = [];
    const queue = [node.id];
    seen.add(node.id);
    while (queue.length) {
      const iri = queue.shift()!;
      island.push(iri);
      for (const next of neighbours.get(iri)!) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    islands.push(island);
  }
  return islands.sort((a, b) => b.length - a.length);
}

/** The classes of a graph linked with no other class. */
export function unlinkedOf(graph: DataModelGraph): string[] {
  const linked = new Set(
    graph.edges.filter(edge => edge.source !== edge.target).flatMap(edge => [edge.source, edge.target])
  );
  return graph.nodes.filter(node => !linked.has(node.id)).map(node => node.id);
}

/** Material icon paths (24 px box) per kind of file a class carries; classes without a file show none. */
const FILE_ICON_PATHS: Partial<Record<RepresentationClass, string>> = {
  StillImageRepresentation:
    'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  MovingImageRepresentation:
    'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
  AudioRepresentation:
    'M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z',
  DocumentRepresentation:
    'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  TextRepresentation: 'M14 17H4v2h10v-2zm6-8H4v2h16V9zM4 15h16v-2H4v2zM4 5v2h16V5H4z',
  ArchiveRepresentation:
    'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.75 1H5.12z',
  DDDRepresentation:
    'M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.3L18.7 8 12 11.7 5.3 8 12 4.3zM5 9.7l6 3.3v6.6l-6-3.3V9.7zm8 9.9V13l6-3.3v6.6l-6 3.3z',
};

/** The kinds of file the legend lists, in its order, with the Material icon the page shows for each. */
export const FILE_KINDS: readonly { representation: RepresentationClass; icon: string }[] = [
  { representation: 'StillImageRepresentation', icon: 'image' },
  { representation: 'MovingImageRepresentation', icon: 'movie' },
  { representation: 'AudioRepresentation', icon: 'audiotrack' },
  { representation: 'DocumentRepresentation', icon: 'description' },
  { representation: 'TextRepresentation', icon: 'subject' },
  { representation: 'ArchiveRepresentation', icon: 'archive' },
  { representation: 'DDDRepresentation', icon: 'view_in_ar' },
];

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** A file icon in a white rounded chip, as an image the graph draws in a class's box; none for a class without file. */
export function fileIconImage(representation: RepresentationClass | undefined, color: string): string | undefined {
  const path = representation && FILE_ICON_PATHS[representation];
  if (!path) return undefined;
  return svgUri(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="6" fill="#FFFFFF" fill-opacity="0.8"/>' +
      `<path transform="translate(5 5) scale(0.9167)" d="${path}" fill="${color}"/></svg>`
  );
}

/** The stripes' image size at scale 1: one tile big enough to cover any box, as the graph cannot repeat an image. */
export const TEXTURE_TILE = { width: 700, height: 200 };

/**
 * A family's stripes, as an image laid over the box; none for a plain family. Dark stripes are drawn in its dark
 * shade; white ones only on the top class, as a subclass's light fill would hide them, so its stripes stay dark.
 */
export function textureImage(texture: FamilyTexture, color: string, sub = false): string | undefined {
  if (!texture.stripes) return undefined;
  const white = texture.stripes === 'white' && !sub;
  const [step, width, opacity] = texture.stripes === 'dark' ? [20, 5, 0.55] : white ? [17, 4, 0.7] : [17, 4, 0.45];
  const { width: w, height: h } = TEXTURE_TILE;
  const lines = Array.from({ length: Math.ceil((w + h) / step) }, (_, i) => `M${i * step - h} ${h}L${i * step} 0`).join(
    ''
  );
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${lines}" stroke="${white ? '#FFFFFF' : color}" ` +
      `stroke-opacity="${opacity}" stroke-width="${width}"/></svg>`
  );
}

/** Room between islands, and between a column of small islands and the next, at scale 1. */
const ISLAND_GAP = 48;
/** Room between the classes of a family, and between blocks laid side by side, at scale 1. */
const BLOCK_GAP = 28;
/** Room inside an island's frame, at scale 1; the graph's stylesheet draws it. */
export const ISLAND_PADDING = 28;
/** Subclasses side by side under their family's top class, at most. */
const FAMILY_COLUMNS = 3;
/** Room a family's frame and its title take around its classes, at scale 1. */
const FAMILY_FRAME = { side: 16, top: 34 };

/** The Cytoscape factory, for a layout run apart from the graph shown. */
export type CytoscapeFactory = (options: Record<string, unknown>) => Core;

/** The room around classes, families and islands, at the scale the graph is drawn at. */
interface Room {
  /** How much bigger than at scale 1 boxes are drawn. */
  scale: number;
  /** The shape of the room the graph is shown in: its width over its height. */
  aspect: number;
  island: number;
  block: number;
  side: number;
  top: number;
}

/** A family laid out on its own, or a class alone: what the force layout moves as one. */
interface Block {
  id: string;
  classes: NodeSingular[];
  w: number;
  h: number;
}

/** How wide a link's label is drawn at scale 1, so the link can be drawn long enough to show it. */
export type LabelWidth = (edge: EdgeSingular) => number;

/** Room left around a link's label on its line, at scale 1: some line on each side, and the arrowhead. */
const LABEL_ROOM = 48;

/** An island laid out by the force layout, before it is given its shape. */
interface LinkedIsland {
  blocks: Block[];
  centers: Map<string, { x: number; y: number }>;
  /** Per pair of linked blocks, how long a line between them must be to show its labels. */
  links: Map<string, number>;
}

/** How islands are shaped: all like the room, or only the first, the others about as wide as tall. */
type IslandShapes = 'all' | 'main';

/** The ways islands are packed: see `flow` and `around`. */
const PACKINGS = ['right', 'below', 'around'] as const;

/**
 * Lays out the Islands view: in each island, every family as a compact block, its top class above its subclasses;
 * blocks spread by a force layout, so families never overlap, and just far apart for links to show their labels;
 * then the islands packed together. Islands can be shaped and packed in several ways: the one that shows the model
 * biggest in the room is kept.
 */
export function arrangeIslands(
  cy: Core,
  cytoscape: CytoscapeFactory,
  scale = 1,
  aspect = 16 / 9,
  labelWidth: LabelWidth = () => 0
): void {
  const room: Room = {
    island: ISLAND_GAP * scale,
    scale,
    aspect,
    block: BLOCK_GAP * scale,
    side: FAMILY_FRAME.side * scale,
    top: FAMILY_FRAME.top * scale,
  };
  const islands = cy.nodes('.island').toArray();
  const linked = new Map<NodeSingular, LinkedIsland>();
  for (const island of islands) {
    const blocks = island
      .children()
      .toArray()
      .map(child => (child.isParent() ? familyBlock(child, room, labelWidth) : classBlock(child)));
    if (island.hasClass('unlinked')) {
      placeInRows(blocks, room);
    } else {
      // Of the force layout's runs, the one whose links cross least, then the smallest.
      const runs = spread(blocks, cytoscape, room, labelWidth);
      const scored = runs.map(run => {
        placeIsland(run, room.aspect, room);
        const box = island.descendants().boundingBox({});
        return { run, crossings: linkCrossings(island), area: box.w * box.h };
      });
      scored.sort((a, b) => a.crossings - b.crossings || a.area - b.area);
      linked.set(island, scored[0].run);
    }
  }
  const shape = (shapes: IslandShapes) =>
    islands.forEach((island, i) => {
      const forces = linked.get(island);
      if (forces) placeIsland(forces, shapes === 'all' || i === 0 ? room.aspect : 1, room);
    });
  let best: { cost: number; shapes: IslandShapes; places: { x: number; y: number }[]; boxes: Box[] } | undefined;
  for (const shapes of linked.size > 1 ? (['all', 'main'] as const) : (['all'] as const)) {
    shape(shapes);
    const boxes = islandBoxes(islands, room);
    for (const packing of PACKINGS) {
      const places = packing === 'around' ? around(boxes, room.island, room.aspect) : flow(boxes, room.island, packing);
      const cost = extent(
        places.map((place, i) => ({ ...place, w: boxes[i].w, h: boxes[i].h })),
        room.aspect
      );
      if (!best || cost < best.cost - 0.5) best = { cost, shapes, places, boxes };
    }
  }
  if (!best) return;
  if (best.shapes !== 'main' && linked.size > 1) shape(best.shapes);
  const { places, boxes } = best;
  islands.forEach((island, i) => move(island, places[i].x - boxes[i].x1, places[i].y - boxes[i].y1));
}

/**
 * A family's classes placed as a block: its top class, then its subclasses in rows below, by label; classes linked to
 * each other far enough apart for their links' labels.
 */
function familyBlock(family: NodeSingular, room: Room, labelWidth: LabelWidth): Block {
  const classes = family.children().toArray();
  const [top, ...subs] = [...classes].sort(
    (a, b) => Number(a.hasClass('sub')) - Number(b.hasClass('sub')) || a.data('label').localeCompare(b.data('label'))
  );
  const rows: NodeSingular[][] = [[top]];
  for (let i = 0; i < subs.length; i += FAMILY_COLUMNS) rows.push(subs.slice(i, i + FAMILY_COLUMNS));
  // How long a line between two classes must be for the labels of the links between them.
  const label = (a: NodeSingular, b: NodeSingular) =>
    Math.max(0, ...a.edgesWith(b).map(edge => (labelWidth(edge) + LABEL_ROOM) * room.scale));
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  // In each row, the gaps between its classes, widened where two of them are linked: the nearest pairs first.
  const gaps = rows.map(row => {
    const gaps = row.slice(1).map(() => room.block);
    for (let span = 1; span < row.length; span++) {
      for (let i = 0; i + span < row.length; i++) {
        const between = sum(row.slice(i + 1, i + span).map(node => node.outerWidth())) + sum(gaps.slice(i, i + span));
        const missing = label(row[i], row[i + span]) - between;
        for (let k = i; missing > 0 && k < i + span; k++) gaps[k] += missing / span;
      }
    }
    return gaps;
  });
  // Between two rows, room for the labels of links from one to the other.
  const rowGaps = rows
    .slice(1)
    .map((row, r) => Math.max(room.block, ...rows[r].flatMap(a => row.map(b => label(a, b)))));
  const widths = rows.map((row, r) => sum(row.map(node => node.outerWidth())) + sum(gaps[r]));
  const width = Math.max(...widths);
  let y = 0;
  rows.forEach((row, r) => {
    const height = Math.max(...row.map(node => node.outerHeight()));
    let x = (width - widths[r]) / 2;
    row.forEach((node, i) => {
      node.position({ x: x + node.outerWidth() / 2, y: y + height / 2 });
      x += node.outerWidth() + (gaps[r][i] ?? 0);
    });
    y += height + (rowGaps[r] ?? 0);
  });
  return {
    id: family.id(),
    classes,
    w: width + 2 * room.side,
    h: y + room.top + room.side,
  };
}

function classBlock(node: NodeSingular): Block {
  node.position({ x: node.outerWidth() / 2, y: node.outerHeight() / 2 });
  return { id: node.id(), classes: [node], w: node.outerWidth(), h: node.outerHeight() };
}

/** The key of a pair of blocks, the same both ways. */
const pairKey = (a: string, b: string) => (a < b ? `${a}\n${b}` : `${b}\n${a}`);

/**
 * Spreads an island's blocks with a force layout run on the blocks alone, apart from the graph shown, each block as
 * big as its classes; linked blocks pull together, as far apart as their labels need, all push apart. It runs once
 * per starting order of the blocks round a circle (see `startOrders`), as each can land differently; the same model
 * always lands the same way.
 */
function spread(blocks: Block[], cytoscape: CytoscapeFactory, room: Room, labelWidth: LabelWidth): LinkedIsland[] {
  const blockOf = new Map(blocks.flatMap(block => block.classes.map(node => [node.id(), block.id] as const)));
  // At scale 1, the longest label between each pair of linked blocks, with room around it.
  const links = new Map<string, number>();
  for (const block of blocks) {
    for (const node of block.classes) {
      for (const edge of node.connectedEdges().toArray()) {
        const [a, b] = [blockOf.get(edge.source().id()), blockOf.get(edge.target().id())];
        if (!a || !b || a === b) continue;
        const key = pairKey(a, b);
        links.set(key, Math.max(links.get(key) ?? 0, labelWidth(edge) + LABEL_ROOM));
      }
    }
  }
  const radius = Math.max(100, (blocks.length * 160) / (2 * Math.PI));
  const graph = cytoscape({
    headless: true,
    styleEnabled: true,
    style: [{ selector: 'node', style: { shape: 'rectangle', width: 'data(w)', height: 'data(h)' } }],
    elements: [
      ...blocks.map(block => ({
        group: 'nodes',
        // At scale 1, as the force layout's distances are set for it; its result is scaled up after.
        data: { id: block.id, w: (block.w + room.block) / room.scale, h: (block.h + room.block) / room.scale },
      })),
      ...[...links].map(([link, length]) => {
        const [source, target] = link.split('\n');
        return { group: 'edges', data: { source, target, length } };
      }),
    ],
  });
  const runs = startOrders(blocks, links).map(order => {
    order.forEach((id, i) =>
      graph.getElementById(id).position({
        x: radius * Math.cos((2 * Math.PI * i) / order.length),
        y: radius * Math.sin((2 * Math.PI * i) / order.length),
      })
    );
    graph
      .layout({
        name: 'cose',
        animate: false,
        randomize: false,
        fit: false,
        idealEdgeLength: (edge: EdgeSingular) => Math.max(50, edge.data('length')),
        nodeOverlap: 40,
        nodeRepulsion: () => 8000,
        gravity: 2.5,
        numIter: 2500,
      } as never)
      .run();
    return new Map(
      blocks.map(block => {
        const { x, y } = graph.getElementById(block.id).position();
        return [block.id, { x: x * room.scale, y: y * room.scale }];
      })
    );
  });
  graph.destroy();
  const scaled = new Map([...links].map(([key, length]) => [key, length * room.scale]));
  return runs.map(centers => ({ blocks, centers, links: scaled }));
}

/**
 * Orders to start the force layout from, round a circle: as the blocks come, the most linked first, and walks along
 * the links from each of the three most linked blocks, breadth first and depth first, so linked blocks start side by
 * side and their links are less likely to cross.
 */
function startOrders(blocks: Block[], links: Map<string, number>): string[][] {
  const ids = blocks.map(block => block.id);
  const neighbours = new Map(ids.map(id => [id, [] as string[]]));
  for (const key of links.keys()) {
    const [a, b] = key.split('\n');
    neighbours.get(a)?.push(b);
    neighbours.get(b)?.push(a);
  }
  const byLinks = [...ids].sort((a, b) => neighbours.get(b)!.length - neighbours.get(a)!.length);
  // From `root`, the most linked neighbours first; breadth first takes the oldest found block next, depth first the newest.
  const walk = (root: string, depthFirst: boolean) => {
    const order: string[] = [];
    const pending = [root];
    while (pending.length) {
      const id = depthFirst ? pending.pop()! : pending.shift()!;
      if (order.includes(id)) continue;
      order.push(id);
      const next = neighbours
        .get(id)!
        .filter(other => !order.includes(other))
        .sort((a, b) => neighbours.get(b)!.length - neighbours.get(a)!.length);
      pending.push(...(depthFirst ? next.reverse() : next));
    }
    return [...order, ...byLinks.filter(id => !order.includes(id))];
  };
  const orders = [ids, byLinks, ...byLinks.slice(0, 3).flatMap(root => [walk(root, false), walk(root, true)])];
  return orders.filter((order, i) => orders.findIndex(other => other.join('\n') === order.join('\n')) === i);
}

/** How many times the island's links cross each other, drawn straight between their classes. */
function linkCrossings(island: NodeSingular): number {
  const segments = island
    .descendants()
    .connectedEdges()
    .toArray()
    .filter(edge => edge.source().id() !== edge.target().id())
    .map(edge => ({
      ends: [edge.source().id(), edge.target().id()],
      a: edge.source().position(),
      b: edge.target().position(),
    }));
  const side = (p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) =>
    Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  let count = 0;
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const [s, t] = [segments[i], segments[j]];
      // Links that share a class meet there, which is no crossing.
      if (s.ends.some(end => t.ends.includes(end))) continue;
      if (side(s.a, s.b, t.a) * side(s.a, s.b, t.b) < 0 && side(t.a, t.b, s.a) * side(t.a, t.b, s.b) < 0) count++;
    }
  }
  return count;
}

/**
 * Places an island's blocks where the force layout left them, the island given a shape, `aspect` its width over its
 * height: stretched one way, squeezed the other, as big as before; then as tight as its links' labels allow.
 */
function placeIsland(island: LinkedIsland, aspect: number, room: Room): void {
  const centers = new Map([...island.centers].map(([id, { x, y }]) => [id, { x, y }]));
  const xs = [...centers.values()].map(c => c.x);
  const ys = [...centers.values()].map(c => c.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  if (spanX > 0 && spanY > 0) {
    const stretch = Math.sqrt(aspect / (spanX / spanY));
    for (const center of centers.values()) {
      center.x *= stretch;
      center.y /= stretch;
    }
  }
  tighten(island.blocks, centers, room.block);
  separate(island.blocks, centers, room.block);
  // Lengthening a link can bring blocks together elsewhere: both again, until neither moves anything.
  for (let round = 0; round < 10 && lengthen(island.blocks, centers, island.links); round++) {
    separate(island.blocks, centers, room.block);
  }
  for (const block of island.blocks) {
    const center = centers.get(block.id)!;
    placeBlock(block, center.x - block.w / 2, center.y - block.h / 2, room);
  }
}

/**
 * Moves blocks closer together, or further apart, all by the same factor, to the tightest spacing at which none
 * overlaps another with `gap` between them; the force layout leaves room to spare between most.
 */
function tighten(blocks: Block[], centers: Map<string, { x: number; y: number }>, gap: number): void {
  let factor = 0;
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const [a, b] = [blocks[i], blocks[j]];
      const [ca, cb] = [centers.get(a.id)!, centers.get(b.id)!];
      const [dx, dy] = [Math.abs(cb.x - ca.x), Math.abs(cb.y - ca.y)];
      // Two blocks are clear of each other once far enough apart across or down, whichever comes first.
      const across = dx > 0 ? ((a.w + b.w) / 2 + gap) / dx : Infinity;
      const down = dy > 0 ? ((a.h + b.h) / 2 + gap) / dy : Infinity;
      factor = Math.max(factor, Math.min(across, down));
    }
  }
  if (factor === 0 || !Number.isFinite(factor)) return;
  for (const center of centers.values()) {
    center.x *= factor;
    center.y *= factor;
  }
}

/**
 * Pushes linked blocks apart along their line, each pair only as far as its labels need: the line from one block's
 * edge to the other's as long as its longest label. Whether any moved.
 */
function lengthen(
  blocks: Block[],
  centers: Map<string, { x: number; y: number }>,
  links: Map<string, number>
): boolean {
  let moved = false;
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const [a, b] = [blocks[i], blocks[j]];
      const label = links.get(pairKey(a.id, b.id));
      if (!label) continue;
      const [ca, cb] = [centers.get(a.id)!, centers.get(b.id)!];
      const [dx, dy] = [cb.x - ca.x, cb.y - ca.y];
      const distance = Math.hypot(dx, dy);
      if (distance === 0) continue;
      const [ux, uy] = [Math.abs(dx) / distance, Math.abs(dy) / distance];
      // How far a block reaches from its centre towards the other.
      const reach = (block: Block) =>
        Math.min(ux > 0 ? block.w / 2 / ux : Infinity, uy > 0 ? block.h / 2 / uy : Infinity);
      const missing = reach(a) + reach(b) + label - distance;
      if (missing <= 0.5) continue;
      moved = true;
      const [px, py] = [((dx / distance) * missing) / 2, ((dy / distance) * missing) / 2];
      ca.x -= px;
      ca.y -= py;
      cb.x += px;
      cb.y += py;
    }
  }
  return moved;
}

/**
 * Pushes blocks apart until none overlaps another, with `gap` between them, each step along the axis they overlap
 * least on; the force layout leaves some overlaps.
 */
function separate(blocks: Block[], centers: Map<string, { x: number; y: number }>, gap: number): void {
  for (let step = 0; step < 100; step++) {
    let moved = false;
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const [a, b] = [blocks[i], blocks[j]];
        const [ca, cb] = [centers.get(a.id)!, centers.get(b.id)!];
        const dx = cb.x - ca.x;
        const dy = cb.y - ca.y;
        const overlapX = (a.w + b.w) / 2 + gap - Math.abs(dx);
        const overlapY = (a.h + b.h) / 2 + gap - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        if (overlapX < overlapY) {
          const push = (overlapX / 2) * (dx < 0 ? -1 : 1);
          ca.x -= push;
          cb.x += push;
        } else {
          const push = (overlapY / 2) * (dy < 0 ? -1 : 1);
          ca.y -= push;
          cb.y += push;
        }
      }
    }
    if (!moved) return;
  }
}

/** Places an island's blocks in rows, biggest first, about as wide as tall. */
function placeInRows(blocks: Block[], room: Room): void {
  const area = blocks.reduce((sum, block) => sum + (block.w + room.block) * (block.h + room.block), 0);
  const maxWidth = Math.max(Math.sqrt(area * 2), ...blocks.map(block => block.w));
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  for (const block of [...blocks].sort((a, b) => b.classes.length - a.classes.length || a.id.localeCompare(b.id))) {
    if (x > 0 && x + block.w > maxWidth) {
      x = 0;
      y += rowHeight + room.block;
      rowHeight = 0;
    }
    placeBlock(block, x, y, room);
    x += block.w + room.block;
    rowHeight = Math.max(rowHeight, block.h);
  }
}

/** Moves a block's classes so its top left corner, frame included, is at `(x, y)`. */
function placeBlock(block: Block, x: number, y: number, room: Room): void {
  const framed = block.classes.length > 1 || block.classes[0].parent().is('.family');
  const dx = x + (framed ? room.side : 0);
  const dy = y + (framed ? room.top : 0);
  const left = Math.min(...block.classes.map(node => node.position('x') - node.outerWidth() / 2));
  const top = Math.min(...block.classes.map(node => node.position('y') - node.outerHeight() / 2));
  for (const node of block.classes) {
    node.position({ x: node.position('x') - left + dx, y: node.position('y') - top + dy });
  }
}

interface Box {
  x1: number;
  y1: number;
  w: number;
  h: number;
}

/** Where each island is: measured from its classes, as a frame's own box may not follow them yet, plus its frame. */
function islandBoxes(islands: NodeSingular[], room: Room): Box[] {
  const margin = ISLAND_PADDING * room.scale + room.top;
  return islands.map(island => {
    const box = island
      .descendants()
      .filter(node => !node.isParent())
      .boundingBox({});
    return { x1: box.x1 - margin, y1: box.y1 - margin, w: box.w + 2 * margin, h: box.h + 2 * margin };
  });
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * How big rectangles together are for a room of shape `aspect`: the width the room must have to show them all. The
 * smaller, the bigger they are shown once fitted.
 */
function extent(rects: Rect[], aspect: number): number {
  const w = Math.max(...rects.map(r => r.x + r.w)) - Math.min(...rects.map(r => r.x));
  const h = Math.max(...rects.map(r => r.y + r.h)) - Math.min(...rects.map(r => r.y));
  return Math.max(w, h * aspect);
}

/**
 * Where islands go, by their top left corner: the first in the middle, each next one beside one already placed, on
 * any side, where the whole stays smallest for the room; between equal places, the one closest to the middle.
 */
function around(boxes: Box[], gap: number, aspect: number): { x: number; y: number }[] {
  const placed: Rect[] = [];
  return boxes.map((box, i) => {
    if (i === 0) {
      placed.push({ x: -box.w / 2, y: -box.h / 2, w: box.w, h: box.h });
      return placed[0];
    }
    let best: { rect: Rect; cost: number; distance: number } | undefined;
    for (const rect of placed.flatMap(other => spotsBeside(other, box, gap))) {
      if (placed.some(other => overlap(rect, other, gap))) continue;
      const cost = extent([...placed, rect], aspect);
      const distance = Math.hypot(rect.x + rect.w / 2, rect.y + rect.h / 2);
      if (!best || cost < best.cost - 0.5 || (cost < best.cost + 0.5 && distance < best.distance)) {
        best = { rect, cost, distance };
      }
    }
    placed.push(best!.rect);
    return best!.rect;
  });
}

/** Places for a box beside another, `gap` away: on each side, lined up with its start, middle or end. */
function spotsBeside(other: Rect, box: Box, gap: number): Rect[] {
  const { w, h } = box;
  const xs = [other.x, other.x + (other.w - w) / 2, other.x + other.w - w];
  const ys = [other.y, other.y + (other.h - h) / 2, other.y + other.h - h];
  return [
    ...ys.flatMap(y => [other.x - gap - w, other.x + other.w + gap].map(x => ({ x, y, w, h }))),
    ...xs.flatMap(x => [other.y - gap - h, other.y + other.h + gap].map(y => ({ x, y, w, h }))),
  ];
}

/** Whether two rectangles come closer than `gap`. */
const overlap = (a: Rect, b: Rect, gap: number) =>
  a.x < b.x + b.w + gap - 0.5 &&
  b.x < a.x + a.w + gap - 0.5 &&
  a.y < b.y + b.h + gap - 0.5 &&
  b.y < a.y + a.h + gap - 0.5;

/**
 * Where islands go, by their top left corner: the first at the origin, the others in columns right of it as tall as
 * it (`right`), or in rows below it as wide as it (`below`).
 */
function flow(boxes: Box[], gap: number, side: 'right' | 'below'): { x: number; y: number }[] {
  const [first] = boxes;
  const across = side === 'right';
  // Along the line, how far a line of small islands may run; across it, where the next line starts.
  const limit = across ? first.h : first.w;
  let line = across ? first.w + gap : first.h + gap;
  let along = 0;
  let thickness = 0;
  return boxes.map((box, i) => {
    if (i === 0) return { x: 0, y: 0 };
    const length = across ? box.h : box.w;
    if (along > 0 && along + length > limit) {
      line += thickness + gap;
      along = 0;
      thickness = 0;
    }
    const place = across ? { x: line, y: along } : { x: along, y: line };
    along += length + gap;
    thickness = Math.max(thickness, across ? box.w : box.h);
    return place;
  });
}

const move = (island: NodeSingular, dx: number, dy: number) =>
  island
    .descendants()
    .filter(node => !node.isParent())
    .positions(node => ({ x: node.position('x') + dx, y: node.position('y') + dy }));
