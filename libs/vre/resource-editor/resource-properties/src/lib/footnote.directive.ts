import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { FootnoteTooltipComponent } from './footnote-tooltip.component';

@Directive({
  selector: '[appFootnote]',
})
export class FootnoteDirective {
  private _overlayRef: OverlayRef | null = null;
  private _hideTimeout?: any;

  constructor(
    private _overlay: Overlay,
    private _positionBuilder: OverlayPositionBuilder,
    private _sanitizer: DomSanitizer
  ) {}

  @HostListener('mouseover', ['$event'])
  onMouseOver(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (targetElement.nodeName.toLowerCase() === 'footnote') {
      const content = targetElement.getAttribute('content');
      if (content === null) {
        throw new AppError('Footnote content is null');
      }
      this.showTooltip(content, event.clientX, event.clientY);
    }
  }

  @HostListener('mouseout', ['$event.target'])
  onMouseOut(targetElement: HTMLElement) {
    if (targetElement.nodeName.toLowerCase() === 'footnote') {
      this.hideTooltipWithDelay();
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;

    if (targetElement.nodeName.toLowerCase() === 'footnote') {
      const uuid = targetElement.getAttribute('id');

      if (uuid) {
        // Find the footnote with the same UUID and scroll to it
        const targetFootnote = document.querySelector(`.footnote[data-uuid="${uuid}"]`);

        if (targetFootnote) {
          // Scroll to the target footnote element
          targetFootnote.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }

  private showTooltip(content: string, mouseX: number, mouseY: number) {
    if (this._overlayRef) {
      this._overlayRef.detach();
    }
    const positionStrategy = this._positionBuilder.flexibleConnectedTo({ x: mouseX, y: mouseY }).withPositions([
      {
        overlayX: 'center',
        overlayY: 'top',
        originX: 'center',
        originY: 'bottom',
        offsetY: 10,
      },
    ]);

    this._overlayRef = this._overlay.create({
      positionStrategy,
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
    });

    const tooltipPortal = new ComponentPortal(FootnoteTooltipComponent);
    if (this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
      clearTimeout(this._hideTimeout);
    }

    const tooltipRef = this._overlayRef.attach(tooltipPortal);
    tooltipRef.instance.content = this._sanitizer.bypassSecurityTrustHtml(content);

    this._overlayRef.overlayElement.addEventListener('mouseenter', () => {
      clearTimeout(this._hideTimeout);
    });

    this._overlayRef.overlayElement.addEventListener('mouseleave', () => {
      this.hideTooltipWithDelay();
    });
  }

  private hideTooltipWithDelay() {
    this._hideTimeout = setTimeout(() => {
      this.hideTooltip();
    }, 300);
  }

  private hideTooltip() {
    if (this._overlayRef) {
      this._overlayRef.detach();
    }
  }
}
