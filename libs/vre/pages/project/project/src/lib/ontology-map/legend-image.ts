/**
 * The texts and file icons of the graph's legend, in the current language, to draw it into an exported image; an
 * entry the graph shown does not need is left out.
 */
export interface LegendTexts {
  title: string;
  subclass?: string;
  other?: string;
  link?: string;
  /** Each kind of file the classes shown carry: its name, and its icon as an image URL. */
  fileKinds: { label: string; icon: string }[];
}

/** The legend's look, as on screen at scale 1: colours and sizes of the one-row legend card. */
const LOOK = {
  height: 44,
  side: 16,
  gap: 16,
  itemGap: 6,
  title: { font: '600 13px Roboto, sans-serif', color: '#111827' },
  text: { font: '400 12.5px Roboto, sans-serif', color: '#1F2937' },
  /** The title strip's subtitle. */
  muted: '#6B7280',
  divider: '#E5E7EB',
  border: '#E5E7EB',
  card: '#FFFFFF',
  icon: { size: 20, background: '#F3F4F6' },
  shape: { w: 22, h: 12 },
};

/** The title strip's look over the graph, at scale 1: the data model's name, and what the graph is filtered on. */
const TITLE = {
  font: '500 18px Roboto, sans-serif',
  subFont: '400 13px Roboto, sans-serif',
  /** The strip's height, with and without what the graph is filtered on. */
  strip: { plain: 48, filtered: 66 },
  /** Where the middle of each line sits from the strip's top. */
  titleY: 28,
  subtitleY: 50,
};

type TextLook = { font: string; color: string; spacing?: number };

/**
 * One piece of the legend's row, a mark or a text: its width at scale 1, and how to draw it from its left edge
 * and the row's middle, on a canvas or as SVG markup.
 */
interface Piece {
  w: number;
  draw: (ctx: CanvasRenderingContext2D, x: number, mid: number) => void;
  svg: (x: number, mid: number) => string;
}

/** The legend's row, as groups of pieces, and its card's size at scale 1. */
interface LegendLayout {
  groups: Piece[][];
  card: { w: number; h: number };
}

const loaded = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const measure = (() => {
  let ctx: CanvasRenderingContext2D | undefined;
  return (text: string, font: string, spacing = 0) => {
    ctx ??= document.createElement('canvas').getContext('2d')!;
    ctx.font = font;
    return ctx.measureText(text).width + spacing * text.length;
  };
})();

/** A text as SVG markup, escaped, its middle at `mid`. */
const svgText = (value: string, x: number, y: number, look: TextLook) =>
  `<text x="${x}" y="${y}" dominant-baseline="central" fill="${look.color}" style="font: ${look.font};${
    look.spacing ? ` letter-spacing: ${look.spacing}px;` : ''
  }">${escapeXml(value)}</text>`;

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);
}

/** The legend's pieces, left to right, and its card's size; `icons` are its kinds of file's icons, loaded. */
function legendLayout(legend: LegendTexts, icons: HTMLImageElement[]): LegendLayout {
  const text = (value: string, look: TextLook): Piece => ({
    w: measure(value, look.font, look.spacing),
    draw: (ctx, x, mid) => {
      ctx.font = look.font;
      ctx.fillStyle = look.color;
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) (ctx as { letterSpacing: string }).letterSpacing = `${look.spacing ?? 0}px`;
      ctx.fillText(value, x, mid);
      if ('letterSpacing' in ctx) (ctx as { letterSpacing: string }).letterSpacing = '0px';
    },
    svg: (x, mid) => svgText(value, x, mid, look),
  });
  const divider: Piece = {
    w: 1,
    draw: (ctx, x, mid) => {
      ctx.fillStyle = LOOK.divider;
      ctx.fillRect(x, mid - 10, 1, 20);
    },
    svg: (x, mid) => `<rect x="${x}" y="${mid - 10}" width="1" height="20" fill="${LOOK.divider}"/>`,
  };
  const box = (fill: string, stroke: string, line: number, dashed = false): Piece => ({
    w: LOOK.shape.w,
    draw: (ctx, x, mid) => {
      const { w, h } = LOOK.shape;
      ctx.beginPath();
      ctx.roundRect(x + line / 2, mid - h / 2 + line / 2, w - line, h - line, 3);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.setLineDash(dashed ? [3, 2] : []);
      ctx.lineWidth = line;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      ctx.setLineDash([]);
    },
    svg: (x, mid) => {
      const { w, h } = LOOK.shape;
      return `<rect x="${x + line / 2}" y="${mid - h / 2 + line / 2}" width="${w - line}" height="${
        h - line
      }" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${line}"${dashed ? ' stroke-dasharray="3 2"' : ''}/>`;
    },
  });
  const arrow: Piece = {
    w: LOOK.shape.w,
    draw: (ctx, x, mid) => {
      ctx.strokeStyle = '#A7AAAD';
      ctx.fillStyle = '#A7AAAD';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, mid);
      ctx.lineTo(x + 17, mid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 16, mid - 3);
      ctx.lineTo(x + 22, mid);
      ctx.lineTo(x + 16, mid + 3);
      ctx.fill();
    },
    svg: (x, mid) =>
      `<path d="M${x} ${mid}H${x + 17}" stroke="#A7AAAD" stroke-width="1.5"/>` +
      `<path d="M${x + 16} ${mid - 3}L${x + 22} ${mid}L${x + 16} ${mid + 3}Z" fill="#A7AAAD"/>`,
  };
  // A tree line as the graph draws it: down from a parent, across, and down to its subclass.
  const treeLine: Piece = {
    w: LOOK.shape.w,
    draw: (ctx, x, mid) => {
      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + 4, mid - 6);
      ctx.lineTo(x + 4, mid);
      ctx.lineTo(x + 18, mid);
      ctx.lineTo(x + 18, mid + 6);
      ctx.stroke();
    },
    svg: (x, mid) =>
      `<path d="M${x + 4} ${mid - 6}V${mid}H${x + 18}V${mid + 6}" fill="none" stroke="#4B5563" stroke-width="1.6"/>`,
  };
  const icon = (image: HTMLImageElement): Piece => ({
    w: LOOK.icon.size,
    draw: (ctx, x, mid) => {
      const size = LOOK.icon.size;
      ctx.beginPath();
      ctx.roundRect(x, mid - size / 2, size, size, 4);
      ctx.fillStyle = LOOK.icon.background;
      ctx.fill();
      ctx.drawImage(image, x + 2, mid - size / 2 + 2, size - 4, size - 4);
    },
    svg: (x, mid) => {
      const size = LOOK.icon.size;
      return (
        `<rect x="${x}" y="${mid - size / 2}" width="${size}" height="${size}" rx="4" fill="${LOOK.icon.background}"/>` +
        `<image x="${x + 2}" y="${mid - size / 2 + 2}" width="${size - 4}" height="${size - 4}" href="${escapeXml(
          image.src
        )}"/>`
      );
    },
  });
  // Pieces that sit together, a mark and its name, are kept `itemGap` apart; the others `gap` apart.
  const shown = <T>(value: string | undefined, group: (value: string) => T): T[] => (value ? [group(value)] : []);
  const groups: Piece[][] = [
    [text(legend.title, LOOK.title)],
    ...(legend.subclass || legend.other || legend.link ? [[divider]] : []),
    ...shown(legend.subclass, subclass => [treeLine, text(subclass, LOOK.text)]),
    ...shown(legend.other, other => [box('#FFFFFF', '#9CA3AF', 1.5, true), text(other, LOOK.text)]),
    ...shown(legend.link, link => [arrow, text(link, LOOK.text)]),
    ...(icons.length
      ? [[divider], ...icons.map((image, i) => [icon(image), text(legend.fileKinds[i].label, LOOK.text)])]
      : []),
  ];
  const groupWidth = (group: Piece[]) =>
    group.reduce((sum, piece) => sum + piece.w, 0) + LOOK.itemGap * (group.length - 1);
  const row = groups.reduce((sum, group) => sum + groupWidth(group), 0) + LOOK.gap * (groups.length - 1);
  return { groups, card: { w: row + 2 * LOOK.side, h: LOOK.height } };
}

/** Each piece of the row with its left edge, from the card's left edge `left`. */
function placed(groups: Piece[][], left: number): { piece: Piece; x: number }[] {
  const out: { piece: Piece; x: number }[] = [];
  let x = left + LOOK.side;
  for (const group of groups) {
    for (const piece of group) {
      out.push({ piece, x });
      x += piece.w + LOOK.itemGap;
    }
    x += LOOK.gap - LOOK.itemGap;
  }
  return out;
}

/**
 * The exported graph with its legend drawn under it, as on screen: a strip across the bottom holding the legend in
 * one row, its shapes then its kinds of file, on `background`. `scaleFor` tells, from the graph image's width, how
 * many times as big as at scale 1 the legend is drawn, so it reads as its classes do.
 */
export async function withLegend(
  png: Blob,
  legend: LegendTexts,
  scaleFor: (graphWidth: number) => number,
  background: string
): Promise<Blob> {
  const [graph, icons] = await Promise.all([
    createImageBitmap(png),
    Promise.all(legend.fileKinds.map(kind => loaded(kind.icon))),
  ]);
  const scale = scaleFor(graph.width);
  const { groups, card } = legendLayout(legend, icons);
  const margin = LOOK.side;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(graph.width, Math.ceil((card.w + 2 * margin) * scale));
  canvas.height = graph.height + Math.ceil((card.h + 2 * margin) * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(graph, 0, 0);
  ctx.scale(scale, scale);
  // The card, under the graph on the left, as on screen.
  const top = graph.height / scale + margin;
  ctx.beginPath();
  ctx.roundRect(margin, top, card.w, card.h, 14);
  ctx.fillStyle = LOOK.card;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = LOOK.border;
  ctx.stroke();
  const mid = top + card.h / 2;
  for (const { piece, x } of placed(groups, margin)) piece.draw(ctx, x, mid);
  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('The legend could not be drawn.'))), 'image/png')
  );
}

/**
 * The data model's name over the exported graph, and under it in grey what the graph is filtered on, if anything: a
 * strip across the top, on `background`.
 */
export async function withTitle(
  png: Blob,
  title: string,
  subtitle: string | undefined,
  scale: number,
  background: string
): Promise<Blob> {
  const graph = await createImageBitmap(png);
  const strip = subtitle ? TITLE.strip.filtered : TITLE.strip.plain;
  const side = LOOK.side;
  const textWidth = Math.max(measure(title, TITLE.font), subtitle ? measure(subtitle, TITLE.subFont) : 0);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(graph.width, Math.ceil((textWidth + 2 * side) * scale));
  canvas.height = graph.height + Math.ceil(strip * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(graph, 0, Math.ceil(strip * scale));
  ctx.scale(scale, scale);
  ctx.textBaseline = 'middle';
  ctx.font = TITLE.font;
  ctx.fillStyle = LOOK.title.color;
  ctx.fillText(title, side, TITLE.titleY);
  if (subtitle) {
    ctx.font = TITLE.subFont;
    ctx.fillStyle = LOOK.muted;
    ctx.fillText(subtitle, side, TITLE.subtitleY);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('The title could not be drawn.'))), 'image/png')
  );
}

/** What goes around the graph in an SVG export: its legend, its title and what it is filtered on, if any. */
export interface SvgFrame {
  legend?: LegendTexts;
  title?: string;
  subtitle?: string;
  /** How many times as big as at scale 1 the legend and title are drawn, from the graph's width. */
  scaleFor: (graphWidth: number) => number;
  background: string;
}

/**
 * The graph's SVG with the title over it and the legend under it, as a PNG export draws them, all as vectors: the
 * graph's own SVG is kept whole, moved under the title. The file icons are embedded as they are, data URLs.
 */
export async function framedSvg(graphSvg: string, frame: SvgFrame): Promise<string> {
  const graph = new DOMParser().parseFromString(graphSvg, 'image/svg+xml').documentElement;
  const gw = parseFloat(graph.getAttribute('width') ?? '0');
  const gh = parseFloat(graph.getAttribute('height') ?? '0');
  const scale = frame.scaleFor(gw);
  const side = LOOK.side;
  const margin = LOOK.side;
  const parts: string[] = [];
  let width = gw;

  const strip = frame.title ? (frame.subtitle ? TITLE.strip.filtered : TITLE.strip.plain) * scale : 0;
  if (frame.title) {
    const textWidth = Math.max(
      measure(frame.title, TITLE.font),
      frame.subtitle ? measure(frame.subtitle, TITLE.subFont) : 0
    );
    width = Math.max(width, (textWidth + 2 * side) * scale);
    parts.push(
      `<g transform="scale(${scale})">`,
      svgText(frame.title, side, TITLE.titleY, { font: TITLE.font, color: LOOK.title.color }),
      frame.subtitle ? svgText(frame.subtitle, side, TITLE.subtitleY, { font: TITLE.subFont, color: LOOK.muted }) : '',
      '</g>'
    );
  }

  graph.setAttribute('x', '0');
  graph.setAttribute('y', String(strip));
  parts.push(new XMLSerializer().serializeToString(graph));

  let height = strip + gh;
  if (frame.legend) {
    const icons = await Promise.all(frame.legend.fileKinds.map(kind => loaded(kind.icon)));
    const { groups, card } = legendLayout(frame.legend, icons);
    width = Math.max(width, (card.w + 2 * margin) * scale);
    const top = height / scale + margin;
    const mid = top + card.h / 2;
    parts.push(
      `<g transform="scale(${scale})">`,
      `<rect x="${margin}" y="${top}" width="${card.w}" height="${card.h}" rx="14" fill="${LOOK.card}" stroke="${LOOK.border}" stroke-width="1"/>`,
      ...placed(groups, margin).map(({ piece, x }) => piece.svg(x, mid)),
      '</g>'
    );
    height += (card.h + 2 * margin) * scale;
  }

  const w = Math.ceil(width);
  const h = Math.ceil(height);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="100%" height="100%" fill="${frame.background}"/>` +
    parts.join('') +
    '</svg>'
  );
}
