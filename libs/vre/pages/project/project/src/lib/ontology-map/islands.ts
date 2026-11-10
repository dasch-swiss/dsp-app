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
}

export const familyHue = (index: number) => FAMILY_HUES[index % FAMILY_HUES.length];
export const familyTexture = (index: number): FamilyTexture =>
  TEXTURES[Math.floor(index / FAMILY_HUES.length) % TEXTURES.length];

/** The graph's background, which a family's frame tints. */
const CANVAS = '#F9FAFB';

/**
 * A family frame's fill: a quarter of its hue over the graph's background, mixed into one solid colour, so the frame
 * hides the links that pass under it.
 */
export function familyTint(hue: string, share = 0.25): string {
  const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const [over, under] = [channels(hue), channels(CANVAS)];
  return `#${over
    .map((channel, i) => Math.round(channel * share + under[i] * (1 - share)))
    .map(channel => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * A colour per class of the data model, as a CSS background: its family's hue with the stripes the graph draws over
 * it, so a class looks the same in the graph and in the lists of classes and properties, whatever is filtered.
 */
export function familyColors(graph: DataModelGraph): Map<string, string> {
  return new Map([...classFamilies(graph)].map(([iri, family]) => [iri, familySwatch(family)]));
}

/** A class's look as a CSS background: its fill, and over it its family's stripes, as `textureImage` draws them. */
export function familySwatch(family: ClassFamily): string {
  const fill = familyColor(family);
  const { stripes } = familyTexture(family.index);
  if (!stripes) return fill;
  const { dark } = familyHue(family.index);
  const white = stripes === 'white' && !family.sub;
  const [color, opacity] = stripes === 'dark' ? [dark, 0.55] : white ? ['#FFFFFF', 0.7] : [dark, 0.45];
  const [r, g, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
  const line = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  return `repeating-linear-gradient(45deg, ${line} 0 2px, transparent 2px 6px), ${fill}`;
}

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
      families.set(iri, { root, index, sub: iri !== root });
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

/** How wide a family's colour tab is at scale 1, in the Colour tab look; its box is widened for it. */
export const TAB_WIDTH = 18;

/** The Colour tab look's borders, the line closing a tab, and its file icons: one dark slate, whatever the family. */
export const TAB_LINE = '#475569';

/** Two colours mixed into one: `share` of the first over the rest of the second. */
function mix(over: string, under: string, share: number): string {
  const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const [a, b] = [channels(over), channels(under)];
  return `#${a
    .map((channel, i) => Math.round(channel * share + b[i] * (1 - share)))
    .map(channel => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * A family's colour tab, for the Colour tab look: a narrow band at the left of a white box, in the family's hue,
 * stronger on the top class than on its subclasses; past the first ten families, with white stripes. The label stays
 * on white, so no colour or pattern ever lies behind it. One image tall enough for any box, as the graph cannot
 * repeat one.
 */
export function tabImage(family: ClassFamily): string {
  const hue = familyHue(family.index);
  const fill = family.sub ? hue.base : mix(hue.dark, hue.base, 0.55);
  const { stripes } = familyTexture(family.index);
  const h = TEXTURE_TILE.height;
  const lines = stripes
    ? `<path d="${Array.from({ length: Math.ceil(h / 6) + 2 }, (_, i) => `M0 ${i * 6}L${TAB_WIDTH} ${i * 6 - TAB_WIDTH}`).join('')}" ` +
      'stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="2"/>'
    : '';
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TAB_WIDTH}" height="${h}">` +
      `<rect width="${TAB_WIDTH}" height="${h}" fill="${fill}"/>${lines}` +
      `<rect x="${TAB_WIDTH - 1}" width="1" height="${h}" fill="${TAB_LINE}"/></svg>`
  );
}

/** Room between islands, and between a column of small islands and the next, at scale 1. */
const ISLAND_GAP = 24;
/** Room between the classes of a family, and between blocks laid side by side, at scale 1. */
const BLOCK_GAP = 28;
/** Room inside an island's frame, at scale 1; the graph's stylesheet draws it. */
export const ISLAND_PADDING = 12;
/** Subclasses side by side under their family's top class, at most. */
const FAMILY_COLUMNS = 3;
/** Room a family's frame takes around its classes, at scale 1; it has no title, so as much above as on the sides. */
const FAMILY_FRAME = { side: 16, top: 16 };

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

/**
 * A block linked to only one other, itself linked to several: placed round the outside of the island where its link
 * crosses fewest others, rather than by the force layout, which would leave it wherever there is room.
 */
interface Satellite {
  block: Block;
  /** The block it is linked to. */
  anchor: string;
}

/** An island laid out by the force layout, before it is given its shape. */
interface LinkedIsland {
  /** The blocks the force layout places: all but the satellites. */
  blocks: Block[];
  satellites: Satellite[];
  centers: Map<string, { x: number; y: number }>;
  /** Per pair of linked blocks, how long a line between them must be to show its labels. */
  links: Map<string, number>;
  /** The order of the blocks round the circle the force layout started from. */
  order: string[];
}

/** The ways islands are packed: see `flow` and `around`. */
const PACKINGS = ['right', 'below', 'around'] as const;

/** Where an island keeps the starting order its force layout was best run from, once searched for. */
const START_ORDER = 'islandsStartOrder';

/**
 * Lays out the Islands view: in each island, every family as a compact block, its top class above its subclasses;
 * blocks spread by a force layout, so families never overlap, and just far apart for links to show their labels;
 * then the islands packed together. Islands can be shaped and packed in several ways: the one that shows the model
 * biggest in the room is kept. With `search`, an island not laid out yet tries several starts of its force layout and
 * keeps the one whose links cross least, which later layouts of it start from again; without, it starts from that
 * one, or as its classes come.
 */
export function arrangeIslands(
  cy: Core,
  cytoscape: CytoscapeFactory,
  scale = 1,
  aspect = 16 / 9,
  labelWidth: LabelWidth = () => 0,
  search = false
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
      const stored: string[] | undefined = island.scratch(START_ORDER);
      // An order kept for other blocks, from before the classes changed, is no start for these.
      const known = stored?.every(id => blocks.some(block => block.id === id)) ? stored : undefined;
      const runs = spread(blocks, cytoscape, room, labelWidth, known ? 'known' : search ? 'search' : 'first', known);
      // Of the force layout's runs, the one whose links cross least, then the smallest.
      const scored = runs.map(run => {
        if (runs.length > 1) placeIsland(run, room.aspect, room);
        const box = runs.length > 1 ? island.descendants().boundingBox({}) : { w: 0, h: 0 };
        return { run, crossings: runs.length > 1 ? linkCrossings(island) : 0, area: box.w * box.h };
      });
      scored.sort((a, b) => a.crossings - b.crossings || a.area - b.area);
      linked.set(island, scored[0].run);
      if (search && !known) island.scratch(START_ORDER, scored[0].run.order);
    }
  }
  // Islands of a single class have no frame: they go in an empty corner once the others are packed.
  const singles =
    islands.length > 1
      ? islands.filter(island => island.descendants().filter(node => !node.isParent()).length === 1)
      : [];
  const packed = islands.filter(island => !singles.includes(island));
  const mainLinked = packed.length > 0 && linked.has(packed[0]);
  // The main island shaped `main` (its width over its height), the others `others`.
  const shape = (main: number, others: number) =>
    packed.forEach((island, i) => {
      const forces = linked.get(island);
      if (forces) placeIsland(forces, i === 0 ? main : others, room);
    });
  const attempt = (main: number, others: number, packing: (typeof PACKINGS)[number]) => {
    shape(main, others);
    const boxes = islandBoxes(packed, room);
    const places = packing === 'around' ? around(boxes, room.island, room.aspect) : flow(boxes, room.island, packing);
    const cost = extent(
      places.map((place, i) => ({ ...place, w: boxes[i].w, h: boxes[i].h })),
      room.aspect
    );
    return { main, others, packing, places, boxes, cost };
  };
  let best: ReturnType<typeof attempt> | undefined;
  const keep = (option: ReturnType<typeof attempt>) => {
    if (!best || option.cost < best.cost - 0.5) best = option;
  };
  for (const others of linked.size > 1 ? [room.aspect, 1] : [room.aspect]) {
    for (const packing of PACKINGS) {
      let option = attempt(room.aspect, others, packing);
      keep(option);
      // Beside or below the main island, the others take a strip of the room: the main island is shaped again for
      // what they leave, twice, as its new shape moves them.
      if (!mainLinked || packed.length < 2 || packing === 'around') continue;
      for (let round = 0; round < 2; round++) {
        const main = fittedShape(option.main, option.places, option.boxes, packing, room.aspect);
        if (!main) break;
        option = attempt(main, others, packing);
        keep(option);
      }
    }
  }
  if (!best) return;
  const { main, others, places, boxes } = best;
  shape(main, others);
  packed.forEach((island, i) => move(island, places[i].x - boxes[i].x1, places[i].y - boxes[i].y1));
  placeSingles(singles, packed, room);
}

/**
 * The shape the main island, first of `boxes`, is to take so it fills the room the others leave beside it
 * (`right`) or below it (`below`): from `shaped`, the shape it was given, as its box came out of that shape.
 */
function fittedShape(
  shaped: number,
  places: { x: number; y: number }[],
  boxes: Box[],
  packing: 'right' | 'below',
  aspect: number
): number | undefined {
  const [first] = boxes;
  const width = Math.max(...places.map((place, i) => place.x + boxes[i].w));
  const height = Math.max(...places.map((place, i) => place.y + boxes[i].h));
  // The box the main island is to have: the room's shape, less the strip the others take.
  const wanted =
    packing === 'right'
      ? (aspect * height - (width - first.w)) / height
      : first.w / (first.w / aspect - (height - first.h));
  if (!(wanted > 0) || !Number.isFinite(wanted)) return undefined;
  return Math.max(aspect / 4, Math.min(aspect * 4, (shaped * wanted) / (first.w / first.h)));
}

/**
 * Places each island of a single class, which has no frame, in an empty spot inside the packed islands' outline,
 * the closest to a corner, clear of every class and link, and outside every island's frame, so it is not taken for
 * one of that island's classes; where there is none, right of the outline.
 */
function placeSingles(singles: NodeSingular[], packed: NodeSingular[], room: Room): void {
  if (!singles.length) return;
  const boxes = islandBoxes(packed, room);
  const outline = boxes.length
    ? {
        x1: Math.min(...boxes.map(b => b.x1)),
        y1: Math.min(...boxes.map(b => b.y1)),
        x2: Math.max(...boxes.map(b => b.x1 + b.w)),
        y2: Math.max(...boxes.map(b => b.y1 + b.h)),
      }
    : { x1: 0, y1: 0, x2: 0, y2: 0 };
  const gap = room.block;
  // What a single must stay clear of: an island with a frame, all of it; one without, its classes and family frames;
  // and every link drawn straight.
  const taken: Bounds[] = packed.flatMap((island, i) =>
    island.hasClass('alone')
      ? island
          .descendants()
          .toArray()
          .filter(node => !node.isParent() || node.hasClass('family'))
          .map(node => node.boundingBox({ includeLabels: false }))
      : [{ x1: boxes[i].x1, y1: boxes[i].y1, x2: boxes[i].x1 + boxes[i].w, y2: boxes[i].y1 + boxes[i].h }]
  );
  const lines = packed
    .flatMap(island => island.descendants().connectedEdges('[^labelOf]').toArray())
    .map(edge => [edge.source().position(), edge.target().position()] as const);
  const right = outline.x2 + room.island;
  let below = outline.y1;
  for (const single of singles) {
    const node = single.descendants().filter(leaf => !leaf.isParent())[0];
    const [w, h] = [node.outerWidth(), node.outerHeight()];
    const corners = [
      { x: outline.x1, y: outline.y1 },
      { x: outline.x2, y: outline.y1 },
      { x: outline.x1, y: outline.y2 },
      { x: outline.x2, y: outline.y2 },
    ];
    let spot: { x: number; y: number; score: number } | undefined;
    const step = Math.max(gap, h / 2);
    for (let x = outline.x1 + w / 2; x <= outline.x2 - w / 2; x += step) {
      for (let y = outline.y1 + h / 2; y <= outline.y2 - h / 2; y += step) {
        const box = { x1: x - w / 2 - gap, y1: y - h / 2 - gap, x2: x + w / 2 + gap, y2: y + h / 2 + gap };
        const free =
          taken.every(other => box.x2 <= other.x1 || other.x2 <= box.x1 || box.y2 <= other.y1 || other.y2 <= box.y1) &&
          lines.every(([a, b]) => !lineInBox(a, b, box));
        if (!free) continue;
        const score = Math.min(...corners.map(corner => Math.hypot(corner.x - x, corner.y - y)));
        if (!spot || score < spot.score) spot = { x, y, score };
      }
    }
    // No room inside: one under the other, right of the outline.
    if (!spot) {
      spot = { x: right + w / 2, y: below + h / 2, score: 0 };
      below += h + gap;
    }
    const at = node.position();
    move(single, spot.x - at.x, spot.y - at.y);
    taken.push({ x1: spot.x - w / 2, y1: spot.y - h / 2, x2: spot.x + w / 2, y2: spot.y + h / 2 });
  }
}

/** Whether the segment `a`–`b` passes through `box`. */
function lineInBox(a: Point, b: Point, box: Bounds): boolean {
  const inside = (p: Point) => p.x > box.x1 && p.x < box.x2 && p.y > box.y1 && p.y < box.y2;
  if (inside(a) || inside(b)) return true;
  const corners = [
    { x: box.x1, y: box.y1 },
    { x: box.x2, y: box.y1 },
    { x: box.x2, y: box.y2 },
    { x: box.x1, y: box.y2 },
  ];
  return corners.some((corner, i) => crosses(a, b, corner, corners[(i + 1) % 4]));
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
 * big as its classes; linked blocks pull together, as far apart as their labels need, all push apart. It starts from
 * the blocks round a circle, in the `known` order, in each of `startOrders` to `search` among them, as each can land
 * differently, or as the blocks come; the same model always lands the same way.
 */
function spread(
  blocks: Block[],
  cytoscape: CytoscapeFactory,
  room: Room,
  labelWidth: LabelWidth,
  starts: 'known' | 'search' | 'first',
  known?: string[]
): LinkedIsland[] {
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
  const satellites = satellitesOf(blocks, links);
  const core = blocks.filter(block => !satellites.some(satellite => satellite.block === block));
  const coreLinks = new Map(
    [...links].filter(([key]) => key.split('\n').every(id => core.some(block => block.id === id)))
  );
  const radius = Math.max(100, (core.length * 160) / (2 * Math.PI));
  const graph = cytoscape({
    headless: true,
    styleEnabled: true,
    style: [{ selector: 'node', style: { shape: 'rectangle', width: 'data(w)', height: 'data(h)' } }],
    elements: [
      ...core.map(block => ({
        group: 'nodes',
        // At scale 1, as the force layout's distances are set for it; its result is scaled up after.
        data: { id: block.id, w: (block.w + room.block) / room.scale, h: (block.h + room.block) / room.scale },
      })),
      ...[...coreLinks].map(([link, length]) => {
        const [source, target] = link.split('\n');
        return { group: 'edges', data: { source, target, length } };
      }),
    ],
  });
  const ids = core.map(block => block.id);
  // An order kept for other blocks, from before the classes changed, is no start for these.
  const usable = known?.length === ids.length && ids.every(id => known.includes(id)) ? known : undefined;
  const orders = starts === 'known' && usable ? [usable] : starts === 'search' ? startOrders(core, coreLinks) : [ids];
  const runs = orders.map(order => {
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
    const centers = new Map(
      core.map(block => {
        const { x, y } = graph.getElementById(block.id).position();
        return [block.id, { x: x * room.scale, y: y * room.scale }];
      })
    );
    return { order, centers };
  });
  graph.destroy();
  const scaled = new Map([...links].map(([key, length]) => [key, length * room.scale]));
  return runs.map(({ order, centers }) => ({ blocks: core, satellites, centers, links: scaled, order }));
}

/** The island's satellites: each block linked to one other only, which is itself linked to several. */
function satellitesOf(blocks: Block[], links: Map<string, number>): Satellite[] {
  const neighbours = new Map(blocks.map(block => [block.id, new Set<string>()]));
  for (const key of links.keys()) {
    const [a, b] = key.split('\n');
    neighbours.get(a)?.add(b);
    neighbours.get(b)?.add(a);
  }
  return blocks.flatMap(block => {
    const [anchor, ...others] = neighbours.get(block.id)!;
    return anchor && !others.length && neighbours.get(anchor)!.size > 1 ? [{ block, anchor }] : [];
  });
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
    .connectedEdges('[^labelOf]')
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
  placeSatellites(island, centers, room);
}

interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const rectAt = (center: { x: number; y: number }, block: Block): Bounds => ({
  x1: center.x - block.w / 2,
  y1: center.y - block.h / 2,
  x2: center.x + block.w / 2,
  y2: center.y + block.h / 2,
});

/** How many directions round the graph a satellite may be placed in. */
const DIRECTIONS = 36;

type Point = { x: number; y: number };

/** Whether the segments `a`–`b` and `c`–`d` cross, not merely meet. */
function crosses(a: Point, b: Point, c: Point, d: Point): boolean {
  const side = (p: Point, q: Point, r: Point) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

/**
 * Places the satellites all round the outside of the island's other blocks, each in the direction where its link,
 * from the class it is linked to, crosses the fewest other links, the shortest among those; never over a block.
 */
function placeSatellites(island: LinkedIsland, centers: Map<string, Point>, room: Room): void {
  if (!island.satellites.length) return;
  const placed = island.blocks.map(block => rectAt(centers.get(block.id)!, block));
  const outer = {
    x1: Math.min(...placed.map(r => r.x1)),
    y1: Math.min(...placed.map(r => r.y1)),
    x2: Math.max(...placed.map(r => r.x2)),
    y2: Math.max(...placed.map(r => r.y2)),
  };
  const middle = { x: (outer.x1 + outer.x2) / 2, y: (outer.y1 + outer.y2) / 2 };
  // The links between the other blocks, and those of the satellites placed so far, as straight lines.
  const core = new Set(island.blocks.flatMap(block => block.classes.map(node => node.id())));
  const lines = island.blocks
    .flatMap(block => block.classes)
    .flatMap(node => node.connectedEdges('[^labelOf]').toArray())
    .filter(edge => core.has(edge.source().id()) && core.has(edge.target().id()))
    .map(edge => ({
      ends: [edge.source().id(), edge.target().id()],
      a: edge.source().position(),
      b: edge.target().position(),
    }));
  const blockOf = new Map(island.blocks.map(block => [block.id, block]));
  for (const satellite of island.satellites) {
    // The class it links to: the one of that family it has most links with, the top class first among equals.
    const anchor = blockOf.get(satellite.anchor)!;
    const linksWith = (node: NodeSingular) =>
      satellite.block.classes.reduce((sum, own) => sum + own.edgesWith(node).filter('[^labelOf]').length, 0);
    const by = [...anchor.classes].sort(
      (a, b) => linksWith(b) - linksWith(a) || Number(a.hasClass('sub')) - Number(b.hasClass('sub'))
    )[0];
    const from = by.position();
    // Every class of the block it is linked to that it has links with, once per link: each is a line to it.
    const ends = anchor.classes.flatMap(node => Array.from({ length: linksWith(node) }, () => node));
    const label = island.links.get(pairKey(satellite.block.id, satellite.anchor)) ?? 0;
    let best: { spot: Bounds; center: Point; cost: number } | undefined;
    for (let ring = 0; !best && ring < 6; ring++) {
      for (let k = 0; k < DIRECTIONS; k++) {
        const angle = (2 * Math.PI * k) / DIRECTIONS;
        const u = { x: Math.cos(angle), y: Math.sin(angle) };
        // Just outside the other blocks in that direction, further out ring by ring where there is no room.
        const exit = Math.min(
          u.x > 0 ? (outer.x2 - middle.x) / u.x : u.x < 0 ? (outer.x1 - middle.x) / u.x : Infinity,
          u.y > 0 ? (outer.y2 - middle.y) / u.y : u.y < 0 ? (outer.y1 - middle.y) / u.y : Infinity
        );
        const reach = Math.min(
          u.x !== 0 ? satellite.block.w / 2 / Math.abs(u.x) : Infinity,
          u.y !== 0 ? satellite.block.h / 2 / Math.abs(u.y) : Infinity
        );
        let distance = exit + 2 * room.block + reach + ring * 4 * room.block;
        let center = { x: middle.x + u.x * distance, y: middle.y + u.y * distance };
        // Far enough from the class it links to for the link's label.
        const length = Math.hypot(center.x - from.x, center.y - from.y) - reach;
        if (length < label) {
          distance += label - length;
          center = { x: middle.x + u.x * distance, y: middle.y + u.y * distance };
        }
        const spot = rectAt(center, satellite.block);
        const clear = placed.every(
          other =>
            spot.x2 + room.block <= other.x1 ||
            other.x2 + room.block <= spot.x1 ||
            spot.y2 + room.block <= other.y1 ||
            other.y2 + room.block <= spot.y1
        );
        if (!clear) continue;
        const crossed = ends.reduce(
          (sum, end) =>
            sum +
            lines.filter(line => !line.ends.includes(end.id()) && crosses(end.position(), center, line.a, line.b))
              .length,
          0
        );
        // Each crossing outweighs any length.
        const cost = crossed * 1e6 + Math.hypot(center.x - from.x, center.y - from.y);
        if (!best || cost < best.cost) best = { spot, center, cost };
      }
    }
    if (!best) continue;
    placeBlock(satellite.block, best.spot.x1, best.spot.y1, room);
    placed.push(best.spot);
    lines.push(...ends.map(end => ({ ends: [end.id()], a: end.position(), b: best!.center })));
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
  // Its padding, and round a family its frame: a little on the sides and below, its name above.
  const [side, top] = [ISLAND_PADDING * room.scale + room.side, ISLAND_PADDING * room.scale + room.top];
  return islands.map(island => {
    const box = island
      .descendants()
      .filter(node => !node.isParent())
      .boundingBox({});
    return { x1: box.x1 - side, y1: box.y1 - top, w: box.w + 2 * side, h: box.h + top + side };
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
