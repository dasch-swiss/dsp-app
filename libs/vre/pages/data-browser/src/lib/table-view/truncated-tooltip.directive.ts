import { Directive, ElementRef, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Shows the full text in a tooltip, but only while the element is cut off by its ellipsis.
 *
 * The element needs `overflow: hidden` and `text-overflow: ellipsis` of its own: truncation is
 * read as its content being wider than its box.
 */
@Directive({
  selector: '[appTruncatedTooltip]',
  hostDirectives: [{ directive: MatTooltip, inputs: ['matTooltip: appTruncatedTooltip'] }],
  host: {
    // Must run before MatTooltip's own pointer listener, which is added after the view is built.
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
