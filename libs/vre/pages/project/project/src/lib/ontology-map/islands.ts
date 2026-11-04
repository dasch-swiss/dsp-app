import type { RepresentationClass } from '@dasch-swiss/vre/3rd-party-services/open-api';
import type { Core, NodeSingular } from 'cytoscape';
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

/** The looks, ten families each: plain, then dark stripes, white stripes, and the three again with a double border. */
const TEXTURES: FamilyTexture[] = [
  { double: false },
  { stripes: 'dark', double: false },
  { stripes: 'white', double: false },
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

/**
 * Lays out the Islands view: in each island, every family as a compact block, its top class above its subclasses;
 * blocks spread by a force layout, so families never overlap; then the islands packed side by side, the biggest on
 * the left and the smaller ones in columns to its right, about as tall as it.
 */
export function arrangeIslands(cy: Core, cytoscape: CytoscapeFactory, scale = 1, aspect = 16 / 9): void {
  const room: Room = {
    island: ISLAND_GAP * scale,
    scale,
    aspect,
    block: BLOCK_GAP * scale,
    side: FAMILY_FRAME.side * scale,
    top: FAMILY_FRAME.top * scale,
  };
  const islands = cy.nodes('.island').toArray();
  for (const island of islands) {
    const blocks = island
      .children()
      .toArray()
      .map(child => (child.isParent() ? familyBlock(child, room) : classBlock(child)));
    if (island.hasClass('unlinked')) {
      placeInRows(blocks, room);
    } else {
      spread(blocks, cytoscape, room);
    }
  }
  pack(islands, room);
}

/** A family's classes placed as a block: its top class, then its subclasses in rows below, by label. */
function familyBlock(family: NodeSingular, room: Room): Block {
  const classes = family.children().toArray();
  const [top, ...subs] = [...classes].sort(
    (a, b) => Number(a.hasClass('sub')) - Number(b.hasClass('sub')) || a.data('label').localeCompare(b.data('label'))
  );
  const rows: NodeSingular[][] = [[top]];
  for (let i = 0; i < subs.length; i += FAMILY_COLUMNS) rows.push(subs.slice(i, i + FAMILY_COLUMNS));
  const widths = rows.map(row => row.reduce((sum, node) => sum + node.outerWidth(), 0) + room.block * (row.length - 1));
  const width = Math.max(...widths);
  let y = 0;
  rows.forEach((row, r) => {
    const height = Math.max(...row.map(node => node.outerHeight()));
    let x = (width - widths[r]) / 2;
    for (const node of row) {
      node.position({ x: x + node.outerWidth() / 2, y: y + height / 2 });
      x += node.outerWidth() + room.block;
    }
    y += height + room.block;
  });
  return {
    id: family.id(),
    classes,
    w: width + 2 * room.side,
    h: y - room.block + room.top + room.side,
  };
}

function classBlock(node: NodeSingular): Block {
  node.position({ x: node.outerWidth() / 2, y: node.outerHeight() / 2 });
  return { id: node.id(), classes: [node], w: node.outerWidth(), h: node.outerHeight() };
}

/**
 * Spreads an island's blocks with a force layout run on the blocks alone, apart from the graph shown, each block as
 * big as its classes; linked blocks pull together, all push apart, none overlap. It starts from a circle, so the
 * same model always lands the same way.
 */
function spread(blocks: Block[], cytoscape: CytoscapeFactory, room: Room): void {
  const blockOf = new Map(blocks.flatMap(block => block.classes.map(node => [node.id(), block.id] as const)));
  const links = new Set<string>();
  for (const block of blocks) {
    for (const node of block.classes) {
      for (const edge of node.connectedEdges().toArray()) {
        const [a, b] = [blockOf.get(edge.source().id()), blockOf.get(edge.target().id())];
        if (a && b && a !== b) links.add(a < b ? `${a}\n${b}` : `${b}\n${a}`);
      }
    }
  }
  const radius = Math.max(100, (blocks.length * 160) / (2 * Math.PI));
  const layout = cytoscape({
    headless: true,
    styleEnabled: true,
    style: [{ selector: 'node', style: { shape: 'rectangle', width: 'data(w)', height: 'data(h)' } }],
    elements: [
      ...blocks.map((block, i) => ({
        group: 'nodes',
        // At scale 1, as the force layout's distances are set for it; its result is scaled up after.
        data: { id: block.id, w: (block.w + room.block) / room.scale, h: (block.h + room.block) / room.scale },
        position: {
          x: radius * Math.cos((2 * Math.PI * i) / blocks.length),
          y: radius * Math.sin((2 * Math.PI * i) / blocks.length),
        },
      })),
      ...[...links].map(link => {
        const [source, target] = link.split('\n');
        return { group: 'edges', data: { source, target } };
      }),
    ],
  });
  layout
    .layout({
      name: 'cose',
      animate: false,
      randomize: false,
      fit: false,
      idealEdgeLength: () => 50,
      nodeOverlap: 40,
      nodeRepulsion: () => 8000,
      gravity: 2.5,
      numIter: 2500,
    } as never)
    .run();
  const centers = new Map(
    blocks.map(block => {
      const { x, y } = layout.getElementById(block.id).position();
      return [block.id, { x: x * room.scale, y: y * room.scale }];
    })
  );
  // The island takes the shape of the room it is shown in: stretched one way, squeezed the other, as big as before.
  const xs = [...centers.values()].map(c => c.x);
  const ys = [...centers.values()].map(c => c.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  if (spanX > 0 && spanY > 0) {
    const stretch = Math.sqrt(room.aspect / (spanX / spanY));
    for (const center of centers.values()) {
      center.x *= stretch;
      center.y /= stretch;
    }
  }
  tighten(blocks, centers, room.block);
  separate(blocks, centers, room.block);
  for (const block of blocks) {
    const center = centers.get(block.id)!;
    placeBlock(block, center.x - block.w / 2, center.y - block.h / 2, room);
  }
  layout.destroy();
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
      // Two blocks are clear of each other once far enough apart across or down, whichever comes first.
      const across = Math.abs(cb.x - ca.x) > 0 ? ((a.w + b.w) / 2 + gap) / Math.abs(cb.x - ca.x) : Infinity;
      const down = Math.abs(cb.y - ca.y) > 0 ? ((a.h + b.h) / 2 + gap) / Math.abs(cb.y - ca.y) : Infinity;
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

/**
 * Moves islands, biggest first: the first alone, the others in columns to its right, as tall as it, or in rows below
 * it, as wide as it, whichever makes the whole closer to the shape of the room it is shown in.
 */
function pack(islands: NodeSingular[], room: Room): void {
  if (islands.length === 0) return;
  // Measured from the classes, as a frame's own box may not follow them yet; widened by the room the frames take.
  const margin = ISLAND_PADDING * room.scale + room.top;
  const boxes: Box[] = islands.map(island => {
    const box = island
      .descendants()
      .filter(node => !node.isParent())
      .boundingBox({});
    return { x1: box.x1 - margin, y1: box.y1 - margin, w: box.w + 2 * margin, h: box.h + 2 * margin };
  });
  const right = flow(boxes, room.island, 'right');
  const below = flow(boxes, room.island, 'below');
  const misfit = (places: { x: number; y: number }[]) => {
    const w = Math.max(...places.map((place, i) => place.x + boxes[i].w));
    const h = Math.max(...places.map((place, i) => place.y + boxes[i].h));
    return Math.abs(Math.log(w / h / room.aspect));
  };
  const places = misfit(below) < misfit(right) ? below : right;
  islands.forEach((island, i) => move(island, places[i].x - boxes[i].x1, places[i].y - boxes[i].y1));
}

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
