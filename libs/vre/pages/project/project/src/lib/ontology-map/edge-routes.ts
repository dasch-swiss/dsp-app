import type { Core, ElementDefinition } from 'cytoscape';

/** A point on the graph. */
export interface Point {
  x: number;
  y: number;
}

/** A class's box on the graph, by its corners. */
export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * How a link bends: the curve's control point `distance` from the straight line, positive to the left as seen from
 * the source, at `weight` of the way from the source to the target.
 */
export interface Bend {
  distance: number;
  weight: number;
}

/** Room kept between a link and a box it goes round, at scale 1. */
const CLEARANCE = 10;

/** How many bends are tried each way, from slight to as far as the link is long. */
const TRIES = 48;

/** Distance between links drawn side by side between the same two classes, as the graph draws them by itself. */
const SIDE_BY_SIDE = 32;

const STRAIGHT: Bend = { distance: 0, weight: 0.5 };

/**
 * How links from `source` to `target` bend so they pass through none of `boxes`, `clearance` away: the least bend
 * that clears them, its peak where a box is in the way, so the link stays nearly straight elsewhere. Each link is
 * drawn that far plus its own offset, so several links between the same classes stay apart. Straight when the links
 * are clear without bending; the bend crossing the fewest boxes when no bend is clear.
 */
export function bendFor(source: Point, target: Point, boxes: Rect[], clearance: number, offsets = [0]): Bend {
  const length = Math.hypot(target.x - source.x, target.y - source.y);
  if (length === 0) return STRAIGHT;
  const grown = boxes.map(box => ({
    x1: box.x1 - clearance,
    y1: box.y1 - clearance,
    x2: box.x2 + clearance,
    y2: box.y2 + clearance,
  }));
  // Along the line, and left of it as seen from the source.
  const along = { x: (target.x - source.x) / length, y: (target.y - source.y) / length };
  const normal = { x: -along.y, y: along.x };
  const steps = Math.max(8, Math.ceil(length / Math.max(4, clearance)));
  const crossed = (distance: number, weight: number, box: Rect) => {
    const control = {
      x: source.x + along.x * length * weight + normal.x * distance,
      y: source.y + along.y * length * weight + normal.y * distance,
    };
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const [a, b, c] = [(1 - t) ** 2, 2 * t * (1 - t), t ** 2];
      const x = a * source.x + b * control.x + c * target.x;
      const y = a * source.y + b * control.y + c * target.y;
      if (x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2) return true;
    }
    return false;
  };
  const crossings = ({ distance, weight }: Bend) =>
    offsets.reduce((sum, offset) => sum + grown.filter(box => crossed(distance + offset, weight, box)).length, 0);
  if (crossings(STRAIGHT) === 0) return STRAIGHT;
  // The peak goes where the straight line meets a box in its way, kept off the ends, or in the middle.
  const inTheWay = grown.filter(box => crossed(0, 0.5, box));
  const weights = [
    0.5,
    ...inTheWay.map(box => {
      const position = ((box.x1 + box.x2) / 2 - source.x) * along.x + ((box.y1 + box.y2) / 2 - source.y) * along.y;
      return Math.min(0.8, Math.max(0.2, position / length));
    }),
  ];
  let best = { ...STRAIGHT, count: crossings(STRAIGHT) };
  const step = length / TRIES;
  for (const weight of weights) {
    for (let i = 1; i <= TRIES; i++) {
      const clear = [i, -i].map(k => k * step).find(distance => crossings({ distance, weight }) === 0);
      if (clear === undefined) {
        const count = crossings({ distance: i * step, weight });
        if (best.count > 0 && count < best.count) best = { distance: i * step, weight, count };
        continue;
      }
      // Between the last bend that crossed and the first clear one, the least that is clear.
      let [low, high] = [Math.abs(clear) - step, Math.abs(clear)];
      for (let n = 0; n < 6; n++) {
        const middle = (low + high) / 2;
        if (crossings({ distance: Math.sign(clear) * middle, weight }) === 0) high = middle;
        else low = middle;
      }
      const distance = Math.sign(clear) * high;
      if (best.count > 0 || Math.abs(distance) < Math.abs(best.distance)) best = { distance, weight, count: 0 };
      break;
    }
  }
  return { distance: best.distance, weight: best.weight };
}

/** Room on each side of a link's label, as text: an en space. */
const LABEL_SIDE = ' ';

/**
 * The elements with each link drawn twice, so no line crosses a label: the link itself, whose label the graph does
 * not write, and after it a copy that only writes the label, on an unseen line drawn over every link's line. The
 * copy keeps the link's data and classes, so it is clicked and highlighted as the link; its texts get room on their
 * sides.
 */
export function withLabelsOnTop(elements: ElementDefinition[]): ElementDefinition[] {
  const sided = (text: unknown) =>
    typeof text === 'string' && text
      ? text
          .split('\n')
          .map(line => `${LABEL_SIDE}${line}${LABEL_SIDE}`)
          .join('\n')
      : text;
  const labels = elements
    .filter(element => element.group === 'edges')
    .map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        id: `${edge.data.id} label`,
        labelOf: edge.data.id,
        label: sided(edge.data['label']),
        name: sided(edge.data['name']),
        both: sided(edge.data['both']),
      },
      classes: `${edge.classes ?? ''} label-only`.trim(),
    }));
  return [...elements, ...labels];
}

/**
 * Bends every link that would pass through a class's box round it, `scale` times as far from the boxes as at scale
 * 1; links clear of every box stay straight. Several links between the same two classes bend side by side. The copy
 * that writes a link's label (see `withLabelsOnTop`) follows the same line.
 */
export function routeEdges(cy: Core, scale: number): void {
  const classes = cy.nodes().filter(node => !node.isParent());
  const boxes = new Map(classes.map(node => [node.id(), node.boundingBox({ includeLabels: false })]));
  const pairs = new Map<string, string[]>();
  cy.edges('[^labelOf]').forEach(edge => {
    const [source, target] = [edge.source().id(), edge.target().id()];
    if (source === target) return;
    const key = source < target ? `${source}\n${target}` : `${target}\n${source}`;
    pairs.set(key, [...(pairs.get(key) ?? []), edge.id()]);
  });
  for (const ids of pairs.values()) {
    const first = cy.getElementById(ids[0]);
    const [source, target] = [first.source(), first.target()];
    const others = [...boxes].filter(([id]) => id !== source.id() && id !== target.id()).map(([, box]) => box);
    const offsets = ids.map((_, i) => (i - (ids.length - 1) / 2) * SIDE_BY_SIDE);
    const bend = bendFor(source.position(), target.position(), others, CLEARANCE * scale, offsets);
    ids.forEach((id, i) => {
      const edge = cy.getElementById(id);
      // Every link gets its line here, a straight one too: left to the graph, it would be bundled with its copy.
      // Seen from its own source, so a link going the other way bends the other way round, its peak as far along.
      const forward = edge.source().id() === source.id();
      const line = {
        bend: (forward ? 1 : -1) * (bend.distance + offsets[i]),
        weight: forward ? bend.weight : 1 - bend.weight,
      };
      edge.data(line);
      cy.getElementById(`${id} label`).data(line);
    });
  }
}
