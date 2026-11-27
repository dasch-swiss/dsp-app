import { A11yModule } from '@angular/cdk/a11y';
import { ESCAPE } from '@angular/cdk/keycodes';
import { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { FeatureTourService } from './feature-tour.service';
import { FEATURE_TOURS, FeatureTourName } from './feature-tours';

type FeatureTourAnchor = ElementRef<HTMLElement>;

export interface FeatureTourStep {
  /**
   * The element the step points at, or several to point at together: the ring goes around all of
   * them. A step none of whose anchors is rendered is skipped.
   */
  anchor: FeatureTourAnchor | readonly (FeatureTourAnchor | undefined)[] | undefined;
  /** Which side of the anchor the bubble opens on; below by default. */
  placement?: 'below' | 'right';
  /**
   * Which edge of the anchor the bubble lines up with, so it stays on screen at either end: the left
   * or right edge below the anchor, the top or bottom edge beside it.
   */
  align: 'start' | 'end';
  titleKey: string;
  bodyKey: string;
}

/** Room between the anchor and the ring drawn around it. */
const SPOTLIGHT_PADDING = 4;

/** Room between the ring and the bubble, which the bubble's arrow spans. */
const BUBBLE_GAP = 10;

/** How long the tour waits, once its first anchor is on the page, before it first opens. */
export const FIRST_APPEARANCE_DELAY_MS = 600;

/** The ring's corner radius around square anchors; around rounded ones it follows their corners. */
const SPOTLIGHT_MIN_RADIUS = 6;

/** Tells the bubbles of tours on one page apart, for the ids their labels point at. */
let nextInstance = 0;

/**
 * A short coachmark tour that introduces a change to the page it is placed on. The page passes the
 * tour's name in `FEATURE_TOURS` and the steps, each pointing at an element of its own.
 *
 * Two CDK overlays per step: a spotlight ring sized to the anchor, whose shadow dims the rest of
 * the page, and the bubble below or beside it. Both follow the anchor on scroll and resize. The page
 * stays usable: the spotlight lets clicks through, so the highlighted control can be tried right away.
 *
 * Shown once per browser, and only on the tour's days (see `FeatureTour`); closing it at any step
 * counts as seen. One tour at a time: a tour whose page opens while another is on screen waits for it.
 */
@Component({
  selector: 'app-feature-tour',
  template: `
    @let step = currentStep();
    @if (origin(); as origin) {
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="origin"
        [cdkConnectedOverlayOpen]="true"
        [cdkConnectedOverlayPositions]="spotlightPositions()"
        [cdkConnectedOverlayWidth]="spotlightBox().width"
        [cdkConnectedOverlayHeight]="spotlightBox().height"
        cdkConnectedOverlayPanelClass="feature-tour-spotlight-pane">
        <div class="spotlight" aria-hidden="true" [style.border-radius.px]="spotlightRadius()"></div>
      </ng-template>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="origin"
        [cdkConnectedOverlayOpen]="true"
        [cdkConnectedOverlayPositions]="bubblePositions()"
        [cdkConnectedOverlayPush]="true"
        (positionChange)="beside.set($event.connectionPair.panelClass === 'feature-tour-beside')"
        (overlayKeydown)="onKeydown($event)">
        <section
          class="bubble"
          [class.align-end]="step!.align === 'end'"
          [class.placement-right]="beside()"
          role="dialog"
          [attr.aria-labelledby]="uid + '-title'"
          [attr.aria-describedby]="uid + '-body'"
          data-cy="feature-tour"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="captureFocus()">
          <span class="arrow" aria-hidden="true"></span>

          <div class="meta">
            <span class="badge">{{ 'ui.featureTour.new' | translate }}</span>
            <span class="progress">
              {{ 'ui.featureTour.progress' | translate: { current: index() + 1, total: steps().length } }}
            </span>
            <button
              mat-icon-button
              class="close"
              data-cy="feature-tour-close"
              [attr.aria-label]="'ui.featureTour.close' | translate"
              (click)="close()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <h2 [id]="uid + '-title'" class="title">{{ step!.titleKey | translate }}</h2>
          <p [id]="uid + '-body'" class="body">{{ step!.bodyKey | translate }}</p>

          <div class="footer">
            @if (!isFirst()) {
              <button mat-button data-cy="feature-tour-back" (click)="back()">
                {{ 'ui.featureTour.back' | translate }}
              </button>
            }

            <span class="spacer"></span>

            <!-- One button whose label changes, not two: swapping the element would drop focus out
                 of the bubble on the last step. Focused first: it is the likely next move, and a
                 focus ring on the close button reads as a hint to dismiss. -->
            <button mat-flat-button color="primary" data-cy="feature-tour-next" cdkFocusInitial (click)="next()">
              {{ (isLast() ? 'ui.featureTour.done' : 'ui.featureTour.next') | translate }}
            </button>
          </div>
        </section>
      </ng-template>
    }
  `,
  styleUrl: './feature-tour.component.css',
  imports: [A11yModule, CdkConnectedOverlay, MatButton, MatIconButton, MatIcon, TranslatePipe],
})
export class FeatureTourComponent {
  readonly tour = input.required<FeatureTourName>();
  readonly steps = input.required<FeatureTourStep[]>();

  readonly uid = `feature-tour-${nextInstance++}`;

  /** The step on screen, or -1 while the tour is closed. */
  readonly index = signal(-1);
  readonly currentStep = computed(() => this.steps()[this.index()]);
  readonly isFirst = computed(() => this.index() === 0);
  readonly isLast = computed(() => this.index() === this.steps().length - 1);

  /** The current step's rendered anchors. */
  readonly anchors = computed(() => renderedAnchors(this.currentStep()));
  /** What both overlays hang from: the ring and the bubble are placed relative to it. */
  readonly origin = computed(() => this.anchors()[0]);

  /** The ring's box, relative to the origin's top-left corner. */
  readonly spotlightBox = signal({ offsetX: 0, offsetY: 0, width: 0, height: 0 });
  /** The ring's corner radius, so that it runs parallel to a pill's rounded ends instead of cutting them. */
  readonly spotlightRadius = signal(SPOTLIGHT_MIN_RADIUS);

  readonly spotlightPositions = computed<ConnectedPosition[]>(() => {
    const { offsetX, offsetY } = this.spotlightBox();
    return [{ originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX, offsetY }];
  });

  /** Placed from the ring rather than the origin, so that the bubble clears every anchor of the step. */
  readonly bubblePositions = computed<ConnectedPosition[]>(() => {
    const step = this.currentStep();
    const { offsetX, offsetY, width, height } = this.spotlightBox();
    const end = step?.align === 'end';
    const below: ConnectedPosition = {
      originX: 'start',
      originY: 'top',
      overlayX: end ? 'end' : 'start',
      overlayY: 'top',
      offsetX: end ? offsetX + width : offsetX,
      offsetY: offsetY + height + BUBBLE_GAP,
    };
    if (step?.placement !== 'right') {
      return [below];
    }
    // Below as a fallback, where the screen is too narrow for the bubble beside the anchor.
    return [
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: end ? 'bottom' : 'top',
        offsetX: offsetX + width + BUBBLE_GAP,
        offsetY: end ? offsetY + height : offsetY,
        panelClass: 'feature-tour-beside',
      },
      { ...below, panelClass: 'feature-tour-below' },
    ];
  });

  private readonly _tourService = inject(FeatureTourService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _document = inject(DOCUMENT);

  /**
   * Whether the bubble takes focus when it opens. Not when the user is already in a page control:
   * the tour opens on a timer, and someone typing in the search field would have their next
   * Space or Enter press Next instead.
   */
  readonly captureFocus = signal(false);

  /** Whether the bubble opened beside its anchor rather than below, which points its arrow left. */
  readonly beside = signal(false);

  /** Set when the tour is due to be shown on this page: on its days, and not seen yet. */
  private readonly _eligible = signal(false);
  /** Set once the delay has run out, or at once on start now. */
  private readonly _ready = signal(false);
  private _startedNow = false;
  private _delayStarted = false;

  constructor() {
    afterNextRender(() => {
      const tour = FEATURE_TOURS[this.tour()];
      const startNow = this._tourService.takeStartNow(tour);
      if (!this._tourService.shouldShow(tour)) {
        return;
      }
      this._tourService.markVisited(tour);
      if (startNow) {
        this._startedNow = true;
        this._ready.set(true);
      }
      this._eligible.set(true);
    });

    // A moment after the first anchor shows up, not after the first render: anchors that depend on
    // loaded data come later, and a delay on top of the loading would let the user start working
    // before the tour interrupts. The moment keeps the tour from landing in the same frame as the page.
    effect(() => {
      if (!this._eligible() || this._ready() || this._delayStarted || this._nextRenderedStep(0, 1) === -1) {
        return;
      }
      this._delayStarted = true;
      const timer = setTimeout(() => this._ready.set(true), FIRST_APPEARANCE_DELAY_MS);
      this._destroyRef.onDestroy(() => clearTimeout(timer));
    });

    // Once ready, opens as soon as no other tour is on screen and a step's anchor is on the page.
    // Once closed, the tour is seen and does not open again.
    effect(() => {
      const tour = FEATURE_TOURS[this.tour()];
      if (!this._ready() || this.index() !== -1 || this._tourService.openTour() !== null) {
        return;
      }
      const first = this._nextRenderedStep(0, 1);
      if (first !== -1 && this._tourService.shouldShow(tour) && this._tourService.claim(tour)) {
        // Decided as it opens, which can be well after the delay: the user may have started typing.
        const focused = this._document.activeElement;
        this.captureFocus.set(this._startedNow || !focused || focused === this._document.body);
        this._goTo(first);
      }
    });

    this._destroyRef.onDestroy(() => this._tourService.release(FEATURE_TOURS[this.tour()]));

    // The anchors are fluid and still settling when the tour opens: the search bar takes its width
    // from the row and the filter chips come and go. Watch the anchors and what they draw, so the ring
    // follows every change rather than keeping its first, often wrong, size.
    effect(onCleanup => {
      const anchors = this.anchors().map(anchor => anchor.nativeElement);
      if (anchors.length === 0) {
        return;
      }
      this._measure();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => this._measure());
      anchors.forEach(anchor => observer.observe(anchor));
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
    this._tourService.markSeen(FEATURE_TOURS[this.tour()]);
    this._tourService.release(FEATURE_TOURS[this.tour()]);
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

  /** The first step from `from`, walking in `direction`, with an anchor on the page; -1 if none. */
  private _nextRenderedStep(from: number, direction: 1 | -1): number {
    const steps = this.steps();
    for (let i = from; i >= 0 && i < steps.length; i += direction) {
      if (renderedAnchors(steps[i]).length > 0) {
        return i;
      }
    }
    return -1;
  }

  private _measure(): void {
    const anchors = this.anchors().map(anchor => anchor.nativeElement);
    if (anchors.length === 0) {
      return;
    }
    const host = anchors[0].getBoundingClientRect();
    const content = union(anchors.map(anchor => anchor.getBoundingClientRect()));
    const corner = Math.max(0, ...anchors.map(anchor => parseFloat(getComputedStyle(anchor).borderTopLeftRadius) || 0));
    const height = content.height + SPOTLIGHT_PADDING * 2;
    this.spotlightRadius.set(Math.min(Math.max(SPOTLIGHT_MIN_RADIUS, corner + SPOTLIGHT_PADDING), height / 2));
    this.spotlightBox.set({
      offsetX: content.left - host.left - SPOTLIGHT_PADDING,
      offsetY: content.top - host.top - SPOTLIGHT_PADDING,
      width: content.width + SPOTLIGHT_PADDING * 2,
      height: content.height + SPOTLIGHT_PADDING * 2,
    });
  }
}

function renderedAnchors(step: FeatureTourStep | undefined): FeatureTourAnchor[] {
  const anchor = step?.anchor;
  if (!anchor) {
    return [];
  }
  const anchors = anchor instanceof ElementRef ? [anchor] : anchor;
  return anchors.filter((a): a is FeatureTourAnchor => a !== undefined);
}

/** The smallest box around all the given ones. */
function union(rects: DOMRect[]): DOMRect {
  const left = Math.min(...rects.map(r => r.left));
  const top = Math.min(...rects.map(r => r.top));
  const right = Math.max(...rects.map(r => r.right));
  const bottom = Math.max(...rects.map(r => r.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}
