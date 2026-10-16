import { Directive, ElementRef, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Shows the full text in a tooltip, but only while the element is cut off by its ellipsis.
 *
 * A plain `title` or `matTooltip` would also pop up over every label that is already readable in
 * full, which is noise on a header row the pointer crosses constantly. Whether the text is cut off
 * depends on the column's current width, so it is measured on each hover rather than once.
 *
 * The element needs `overflow: hidden` and `text-overflow: ellipsis` of its own: truncation is
 * read as its content being wider than its box.
 */
@Directive({
  selector: '[appTruncatedTooltip]',
  hostDirectives: [{ directive: MatTooltip, inputs: ['matTooltip: appTruncatedTooltip'] }],
  host: {
    // Registered before MatTooltip's own pointer listener, which it adds after the view is built,
    // so the tooltip already knows whether it is wanted when that listener asks.
    '(mouseenter)': 'onMouseEnter()',
  },
})
export class TruncatedTooltipDirective {
  private readonly _tooltip = inject(MatTooltip);
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

  onMouseEnter(): void {
    const element = this._host.nativeElement;
    this._tooltip.disabled = element.scrollWidth <= element.clientWidth;
  }
}
