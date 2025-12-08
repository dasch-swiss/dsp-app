// custom-tooltip.directive.ts
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Directive, ElementRef, HostListener, Input, OnDestroy, ViewContainerRef } from '@angular/core';
import { Segment } from './segment';
import { SegmentTooltipComponent } from './segment-tooltip.component';

@Directive({
  selector: '[appCustomTooltip]',
  standalone: false,
})
export class CustomTooltipDirective implements OnDestroy {
  @Input({ required: true }) appCustomTooltip!: Segment;
  private overlayRef!: OverlayRef;
  private hideTimeout: any;

  constructor(
    private readonly _overlay: Overlay,
    private readonly _elementRef: ElementRef,
    private readonly _viewContainerRef: ViewContainerRef
  ) {}

  @HostListener('mouseenter')
  show() {
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef.dispose();
    }
    this.clearHideTimeout();

    const positionStrategy = this._overlay
      .position()
      .flexibleConnectedTo(this._elementRef)
      .withPositions([
        {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 10,
        },
      ]);

    this.overlayRef = this._overlay.create({ positionStrategy });
    const tooltipPortal = new ComponentPortal(SegmentTooltipComponent, this._viewContainerRef);
    const componentRef = this.overlayRef.attach(tooltipPortal);
    componentRef.instance.segment = this.appCustomTooltip;

    componentRef.instance.mouseEnter.subscribe(() => {
      this.clearHideTimeout();
    });
    componentRef.instance.mouseLeave.subscribe(() => {
      this.overlayRef?.dispose();
    });
  }

  @HostListener('mouseleave')
  hide() {
    this.startHideTimeout();
  }

  private startHideTimeout() {
    this.hideTimeout = setTimeout(() => {
      this.overlayRef?.dispose();
    }, 300);
  }

  private clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  ngOnDestroy() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }
}
