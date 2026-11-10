import { Pipe, PipeTransform } from '@angular/core';

/**
 * A class colour as the tab of a chip or a box shows it: the same hue, darker and fuller, so a narrow tab still reads
 * as that colour. A colour that is not a plain hex one, such as a striped background, is kept as it is.
 */
export function tabShade(color: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return color;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const chroma = max - min;
  if (chroma < 0.02) return color;
  const saturation = chroma / (1 - Math.abs(2 * lightness - 1));
  const hue = max === r ? ((g - b) / chroma + 6) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
  const l = Math.max(0.35, lightness - 0.2);
  const s = Math.min(1, saturation + 0.15);
  return `hsl(${Math.round(hue * 60)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

/** `tabShade` in a template. */
@Pipe({ name: 'tabShade' })
export class TabShadePipe implements PipeTransform {
  transform(color: string | undefined, fallback = '#FFFFFF'): string {
    return tabShade(color ?? fallback);
  }
}
