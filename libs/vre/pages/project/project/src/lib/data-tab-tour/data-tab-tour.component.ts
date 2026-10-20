import { A11yModule } from '@angular/cdk/a11y';
import { ESCAPE } from '@angular/cdk/keycodes';
import { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { DataTabTourService } from './data-tab-tour.service';

export interface DataTabTourStep {
  /** The element the step points at. A step whose anchor is not rendered is skipped. */
  anchor: ElementRef<HTMLElement> | undefined;
  /** Which edge of the anchor the bubble lines up with, so it stays on screen at either end. */
  align: 'start' | 'end';
  titleKey: string;
  bodyKey: string;
}

/** Room between the anchor and the ring drawn around it. */
const SPOTLIGHT_PADDING = 4;

/** How long the tour waits after the page renders before it first opens. */
export const FIRST_APPEARANCE_DELAY_MS = 2000;

/**
 * A short coachmark tour that introduces the Data tab's search, filters and table view (DEV-7545).
 *
 * Two CDK overlays per step: a spotlight ring sized to the anchor, whose shadow dims the rest of
 * the page, and the bubble below it. Both follow the anchor on scroll and resize. The page stays
 * usable: the spotlight lets clicks through, so the highlighted control can be tried right away.
 *
 * Shown once per browser; closing it at any step counts as seen.
 */
@Component({
  selector: 'app-data-tab-tour',
  template: `
    @let step = currentStep();
    @if (step?.anchor; as anchor) {
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="anchor"
        [cdkConnectedOverlayOpen]="true"
        [cdkConnectedOverlayPositions]="spotlightPositions()"
        [cdkConnectedOverlayWidth]="spotlightBox().width"
        [cdkConnectedOverlayHeight]="spotlightBox().height"
        cdkConnectedOverlayPanelClass="data-tab-tour-spotlight-pane">
        <div class="spotlight" aria-hidden="true"></div>
      </ng-template>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="anchor"
        [cdkConnectedOverlayOpen]="true"
        [cdkConnectedOverlayPositions]="step!.align === 'end' ? endPositions : startPositions"
        [cdkConnectedOverlayPush]="true"
        (overlayKeydown)="onKeydown($event)">
        <section
          class="bubble"
          [class.align-end]="step!.align === 'end'"
          role="dialog"
          aria-labelledby="data-tab-tour-title"
          aria-describedby="data-tab-tour-body"
          data-cy="data-tab-tour"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true">
          <span class="arrow" aria-hidden="true"></span>

          <div class="meta">
            <span class="badge">{{ 'pages.dataBrowser.tour.new' | translate }}</span>
            <span class="progress">
              {{ 'pages.dataBrowser.tour.progress' | translate: { current: index() + 1, total: steps().length } }}
            </span>
            <button
              mat-icon-button
              class="close"
              data-cy="data-tab-tour-close"
              [attr.aria-label]="'pages.dataBrowser.tour.close' | translate"
              (click)="close()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <h2 id="data-tab-tour-title" class="title">{{ step!.titleKey | translate }}</h2>
          <p id="data-tab-tour-body" class="body">{{ step!.bodyKey | translate }}</p>

          <div class="footer">
            @if (!isFirst()) {
              <button mat-button data-cy="data-tab-tour-back" (click)="back()">
                {{ 'pages.dataBrowser.tour.back' | translate }}
              </button>
            }

            <span class="spacer"></span>

            <!-- One button whose label changes, not two: swapping the element would drop focus out
                 of the bubble on the last step. Focused first: it is the likely next move, and a
                 focus ring on the close button reads as a hint to dismiss. -->
            <button mat-flat-button color="primary" data-cy="data-tab-tour-next" cdkFocusInitial (click)="next()">
              {{ (isLast() ? 'pages.dataBrowser.tour.done' : 'pages.dataBrowser.tour.next') | translate }}
            </button>
          </div>
        </section>
      </ng-template>
    }
  `,
  styleUrl: './data-tab-tour.component.scss',
  imports: [A11yModule, CdkConnectedOverlay, MatButton, MatIconButton, MatIcon, TranslatePipe],
})
export class DataTabTourComponent {
  readonly steps = input.required<DataTabTourStep[]>();

  /** The step on screen, or -1 while the tour is closed. */
  readonly index = signal(-1);
  readonly currentStep = computed(() => this.steps()[this.index()]);
  readonly isFirst = computed(() => this.index() === 0);
  readonly isLast = computed(() => this.index() === this.steps().length - 1);

  /** The ring's box, relative to the anchor's top-left corner. */
  readonly spotlightBox = signal({ offsetX: 0, offsetY: 0, width: 0, height: 0 });

  readonly spotlightPositions = computed<ConnectedPosition[]>(() => {
    const { offsetX, offsetY } = this.spotlightBox();
    return [{ originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX, offsetY }];
  });
  readonly startPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: -SPOTLIGHT_PADDING,
      offsetY: 14,
    },
  ];
  readonly endPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: SPOTLIGHT_PADDING, offsetY: 14 },
  ];

  private readonly _tourService = inject(DataTabTourService);
  private readonly _destroyRef = inject(DestroyRef);

  constructor() {
    // A moment after the first render: the anchors are laid out by then, and the page has had time
    // to load and be looked at before the tour asks for attention.
    afterNextRender(() => {
      if (this._tourService.hasBeenSeen()) {
        return;
      }
      const timer = setTimeout(() => this._goTo(this._nextRenderedStep(0, 1)), FIRST_APPEARANCE_DELAY_MS);
      this._destroyRef.onDestroy(() => clearTimeout(timer));
    });

    // The anchors are fluid and still settling when the tour opens: the search bar takes its width
    // from the row and the filter chips come and go. Watch the anchor and what it draws, so the ring
    // follows every change rather than keeping its first, often wrong, size.
    effect(onCleanup => {
      const anchor = this.currentStep()?.anchor?.nativeElement;
      if (!anchor) {
        return;
      }
      this._measure();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => this._measure());
      [anchor, ...Array.from(anchor.children)].forEach(el => observer.observe(el));
      onCleanup(() => observer.disconnect());
    });
  }

  next(): void {
    const next = this._nextRenderedStep(this.index() + 1, 1);
    if (next === -1) {
      this.close();
    } else {
      this._goTo(next);
    }
  }

  back(): void {
    const previous = this._nextRenderedStep(this.index() - 1, -1);
    if (previous !== -1) {
      this._goTo(previous);
    }
  }

  close(): void {
    this.index.set(-1);
    this._tourService.markSeen();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.keyCode === ESCAPE) {
      event.preventDefault();
      this.close();
    }
  }

  private _goTo(index: number): void {
    this.index.set(index);
  }

  /** The first step from `from`, walking in `direction`, whose anchor is on the page; -1 if none. */
  private _nextRenderedStep(from: number, direction: 1 | -1): number {
    const steps = this.steps();
    for (let i = from; i >= 0 && i < steps.length; i += direction) {
      if (steps[i].anchor) {
        return i;
      }
    }
    return -1;
  }

  private _measure(): void {
    const anchor = this.currentStep()?.anchor?.nativeElement;
    if (!anchor) {
      return;
    }
    const host = anchor.getBoundingClientRect();
    const content = this._contentRect(anchor);
    this.spotlightBox.set({
      offsetX: content.left - host.left - SPOTLIGHT_PADDING,
      offsetY: content.top - host.top - SPOTLIGHT_PADDING,
      width: content.width + SPOTLIGHT_PADDING * 2,
      height: content.height + SPOTLIGHT_PADDING * 2,
    });
  }

  /**
   * The box around what the anchor draws, not the anchor itself. A host that stretches to fill its
   * row (the search bar does) would otherwise put the ring around empty space and its neighbours.
   */
  private _contentRect(anchor: HTMLElement): DOMRect {
    const rects = Array.from(anchor.children)
      .map(child => child.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0);
    if (rects.length === 0) {
      return anchor.getBoundingClientRect();
    }
    const left = Math.min(...rects.map(r => r.left));
    const top = Math.min(...rects.map(r => r.top));
    const right = Math.max(...rects.map(r => r.right));
    const bottom = Math.max(...rects.map(r => r.bottom));
    return new DOMRect(left, top, right - left, bottom - top);
  }
}
