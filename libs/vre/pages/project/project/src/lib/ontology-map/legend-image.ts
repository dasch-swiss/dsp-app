/** The texts and file icons of the graph's legend, in the current language, to draw it into an exported image. */
export interface LegendTexts {
  title: string;
  shapes: string;
  parent: string;
  subclass: string;
  other: string;
  link: string;
  files: string;
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
  heading: { font: '600 10.5px Roboto, sans-serif', color: '#6B7280', spacing: 0.6 },
  text: { font: '400 12.5px Roboto, sans-serif', color: '#1F2937' },
  divider: '#E5E7EB',
  border: '#E5E7EB',
  card: '#FFFFFF',
  icon: { size: 20, background: '#F3F4F6' },
  shape: { w: 22, h: 12 },
};

const loaded = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

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
  const measure = document.createElement('canvas').getContext('2d')!;
  const width = (text: string, font: string, spacing = 0) => {
    measure.font = font;
    return measure.measureText(text).width + spacing * text.length;
  };
  const heading = (text: string) => text.toUpperCase();
  // Each piece of the row, left to right, with its width at scale 1 and how to draw it from its left edge.
  type Piece = { w: number; draw: (ctx: CanvasRenderingContext2D, x: number, mid: number) => void };
  const text = (value: string, look: { font: string; color: string; spacing?: number }): Piece => ({
    w: width(value, look.font, look.spacing),
    draw: (ctx, x, mid) => {
      ctx.font = look.font;
      ctx.fillStyle = look.color;
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) (ctx as { letterSpacing: string }).letterSpacing = `${look.spacing ?? 0}px`;
      ctx.fillText(value, x, mid);
      if ('letterSpacing' in ctx) (ctx as { letterSpacing: string }).letterSpacing = '0px';
    },
  });
  const divider: Piece = {
    w: 1,
    draw: (ctx, x, mid) => {
      ctx.fillStyle = LOOK.divider;
      ctx.fillRect(x, mid - 10, 1, 20);
    },
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
  });
  // Pieces that sit together, a mark and its name, are kept `itemGap` apart; the others `gap` apart.
  const groups: Piece[][] = [
    [text(legend.title, LOOK.title)],
    [divider],
    [text(heading(legend.shapes), LOOK.heading)],
    [box('#D1D5DB', '#4B5563', 2), text(legend.parent, LOOK.text)],
    [box('#E5E7EB', '#9CA3AF', 1), text(legend.subclass, LOOK.text)],
    [box('#FFFFFF', '#9CA3AF', 1.5, true), text(legend.other, LOOK.text)],
    [arrow, text(legend.link, LOOK.text)],
    ...(icons.length
      ? [
          [divider],
          [text(heading(legend.files), LOOK.heading)],
          ...icons.map((image, i) => [icon(image), text(legend.fileKinds[i].label, LOOK.text)]),
        ]
      : []),
  ];
  const groupWidth = (group: Piece[]) =>
    group.reduce((sum, piece) => sum + piece.w, 0) + LOOK.itemGap * (group.length - 1);
  const row = groups.reduce((sum, group) => sum + groupWidth(group), 0) + LOOK.gap * (groups.length - 1);
  const card = { w: row + 2 * LOOK.side, h: LOOK.height };
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
  let x = margin + LOOK.side;
  const mid = top + card.h / 2;
  for (const group of groups) {
    for (const piece of group) {
      piece.draw(ctx, x, mid);
      x += piece.w + LOOK.itemGap;
    }
    x += LOOK.gap - LOOK.itemGap;
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('The legend could not be drawn.'))), 'image/png')
  );
}
