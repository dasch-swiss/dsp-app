import type { Core, EdgeSingular, ElementDefinition } from 'cytoscape';

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
  // Only the boxes a bend could reach: a curve's peak is at most half as far from the line as its control point.
  const reach = length / 2 + Math.max(0, ...offsets.map(Math.abs)) + clearance;
  const area = {
    x1: Math.min(source.x, target.x) - reach,
    y1: Math.min(source.y, target.y) - reach,
    x2: Math.max(source.x, target.x) + reach,
    y2: Math.max(source.y, target.y) + reach,
  };
  const grown = boxes
    .map(box => ({ x1: box.x1 - clearance, y1: box.y1 - clearance, x2: box.x2 + clearance, y2: box.y2 + clearance }))
    .filter(box => box.x2 > area.x1 && box.x1 < area.x2 && box.y2 > area.y1 && box.y1 < area.y2);
  if (!grown.length) return STRAIGHT;
  // Along the line, and left of it as seen from the source.
  const along = { x: (target.x - source.x) / length, y: (target.y - source.y) / length };
  const normal = { x: -along.y, y: along.x };
  // Points along the curve close enough together that none of the boxes slips between two of them.
  const smallest = Math.min(...grown.map(box => Math.min(box.x2 - box.x1, box.y2 - box.y1)));
  const steps = Math.max(8, Math.ceil(length / Math.max(4, smallest / 2)));
  const crossed = (distance: number, weight: number, box: Rect) => {
    const control = {
      x: source.x + along.x * length * weight + normal.x * distance,
      y: source.y + along.y * length * weight + normal.y * distance,
    };
    // A curve lies within the triangle of its ends and control point: a box clear of that is clear of it.
    if (
      box.x2 < Math.min(source.x, target.x, control.x) ||
      box.x1 > Math.max(source.x, target.x, control.x) ||
      box.y2 < Math.min(source.y, target.y, control.y) ||
      box.y1 > Math.max(source.y, target.y, control.y)
    ) {
      return false;
    }
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

/** A link's label as drawn: its middle, half its width and height, and its turn. */
export interface LabelBox {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
  angle: number;
}

/** Whether two labels, each turned its own way, overlap, `gap` apart at least: no axis of either keeps them apart. */
export function labelsOverlap(a: LabelBox, b: LabelBox, gap: number): boolean {
  // Labels further apart than their half diagonals cannot touch, however turned.
  const reach = Math.hypot(a.halfW, a.halfH) + Math.hypot(b.halfW, b.halfH) + gap;
  if (Math.abs(a.x - b.x) > reach || Math.abs(a.y - b.y) > reach) return false;
  const axes = [a.angle, a.angle + Math.PI / 2, b.angle, b.angle + Math.PI / 2].map(t => ({
    x: Math.cos(t),
    y: Math.sin(t),
  }));
  const corners = (box: LabelBox) => {
    const [c, s] = [Math.cos(box.angle), Math.sin(box.angle)];
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([i, j]) => ({
      x: box.x + i * box.halfW * c - j * box.halfH * s,
      y: box.y + i * box.halfW * s + j * box.halfH * c,
    }));
  };
  const [ca, cb] = [corners(a), corners(b)];
  return axes.every(axis => {
    const project = (points: { x: number; y: number }[]) => points.map(p => p.x * axis.x + p.y * axis.y);
    const [pa, pb] = [project(ca), project(cb)];
    return Math.max(...pa) + gap > Math.min(...pb) && Math.max(...pb) + gap > Math.min(...pa);
  });
}

/** How many rounds labels are slid apart at most. */
const LABEL_ROUNDS = 40;

/** How far a label may slide from the middle of its link, as a share of the link's length. */
const LABEL_SLIDE = 0.35;

/**
 * Slides overlapping labels apart, each along its own link, so no two labels cover each other: in rounds, each pair
 * that overlaps moves apart a little, each label as far from the middle of its link as `LABEL_SLIDE` allows. With
 * `only`, the labels of those links alone are placed again; the others stay where they are, in their way.
 */
export function separateLabels(cy: Core, scale: number, only?: ReadonlySet<string>): void {
  const copies = cy.edges('.label-only');
  const movable = (edge: EdgeSingular) => !only || only.has(edge.data('labelOf'));
  cy.batch(() => copies.filter(movable).data({ shiftX: 0, shiftY: 0 }));
  const labels = copies.toArray().flatMap(edge => {
    edge.boundingBox({ includeLabels: true });
    // Where and how big the graph draws the label, kept among its own drawing data.
    const drawn = (edge as unknown as { _private: { rscratch: Record<string, number> } })._private.rscratch;
    if (!drawn['labelWidth'] || drawn['labelX'] === undefined) return [];
    const [s, t] = [edge.source().position(), edge.target().position()];
    const length = Math.hypot(t.x - s.x, t.y - s.y);
    if (length === 0) return [];
    // A label left where it is keeps its slide.
    const [shiftX, shiftY] = [edge.data('shiftX') ?? 0, edge.data('shiftY') ?? 0];
    return [
      {
        edge,
        moves: movable(edge),
        box: {
          x: drawn['labelX'] + shiftX,
          y: drawn['labelY'] + shiftY,
          halfW: drawn['labelWidth'] / 2,
          halfH: drawn['labelHeight'] / 2,
          angle: edge.style('text-rotation') === 'autorotate' ? (drawn['labelAutoAngle'] ?? 0) : 0,
        },
        along: { x: (t.x - s.x) / length, y: (t.y - s.y) / length },
        limit: length * LABEL_SLIDE,
        shift: 0,
      },
    ];
  });
  const gap = 2 * scale;
  // Only pairs with a label that may move: the moving ones first, so each pair comes once.
  labels.sort((a, b) => Number(b.moves) - Number(a.moves));
  const moving = labels.filter(label => label.moves).length;
  for (let round = 0; round < LABEL_ROUNDS; round++) {
    let moved = false;
    for (let i = 0; i < moving; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const [a, b] = [labels[i], labels[j]];
        if (!labelsOverlap(a.box, b.box, gap)) continue;
        // Each away from the other along its own link, by a step of the smaller label's height.
        const step = Math.min(a.box.halfH, b.box.halfH);
        const apart = { x: b.box.x - a.box.x, y: b.box.y - a.box.y };
        for (const [label, sign] of [
          [a, -1],
          [b, 1],
        ] as const) {
          if (!label.moves) continue;
          const towards = Math.sign(apart.x * label.along.x + apart.y * label.along.y) || 1;
          const next = Math.max(-label.limit, Math.min(label.limit, label.shift + sign * towards * step));
          const delta = next - label.shift;
          if (delta === 0) continue;
          label.shift = next;
          label.box.x += delta * label.along.x;
          label.box.y += delta * label.along.y;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  cy.batch(() => {
    for (const { edge, along, shift, moves } of labels) {
      if (moves && shift !== 0) edge.data({ shiftX: along.x * shift, shiftY: along.y * shift });
    }
  });
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
 * that writes a link's label (see `withLabelsOnTop`) follows the same line. With `only`, those links alone, with the
 * others between the same classes, are routed again.
 */
export function routeEdges(cy: Core, scale: number, only?: ReadonlySet<string>): void {
  const classes = cy.nodes().filter(node => !node.isParent());
  const boxes = new Map(classes.map(node => [node.id(), node.boundingBox({ includeLabels: false })]));
  const pairs = new Map<string, string[]>();
  cy.edges('[^labelOf]').forEach(edge => {
    const [source, target] = [edge.source().id(), edge.target().id()];
    if (source === target) return;
    const key = source < target ? `${source}\n${target}` : `${target}\n${source}`;
    pairs.set(key, [...(pairs.get(key) ?? []), edge.id()]);
  });
  const routed = [...pairs.values()].filter(ids => !only || ids.some(id => only.has(id)));
  cy.batch(() => routed.forEach(ids => route(ids)));
  function route(ids: string[]): void {
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
