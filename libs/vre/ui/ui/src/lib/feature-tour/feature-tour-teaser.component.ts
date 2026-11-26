import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ENTER, ESCAPE, SPACE } from '@angular/cdk/keycodes';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { FeatureTour } from './feature-tour';
import { FeatureTourService } from './feature-tour.service';
import { FEATURE_TOURS, FeatureTourName } from './feature-tours';

/** How long the popover stays after the pointer leaves the label, so it can cross to the popover. */
export const TEASER_CLOSE_GRACE_MS = 400;

let nextInstance = 0;

/**
 * A small "New" label that points to a feature tour on another page, for as long as the tour would
 * show there and this browser has not been on that page yet. Its popover offers to start the tour, or
 * to skip it and the tours that follow it (`FeatureTour.follows`) for good.
 *
 * It floats above the top-right corner of its parent, which must be positioned, and takes no room.
 */
@Component({
  selector: 'app-feature-tour-teaser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <button
        #label
        type="button"
        class="label"
        cdkOverlayOrigin
        #origin="cdkOverlayOrigin"
        data-cy="feature-tour-teaser"
        aria-haspopup="dialog"
        [attr.aria-label]="labelKey() | translate"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? uid : null"
        (pointerenter)="onPointerEnter()"
        (pointerleave)="onPointerLeave()"
        (click)="onClick($event)"
        (keydown)="onLabelKeydown($event)">
        {{ 'ui.featureTour.new' | translate }}
      </button>

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="origin"
        [cdkConnectedOverlayOpen]="open()"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayPush]="true"
        (overlayKeydown)="onPopoverKeydown($event)">
        <!-- The padding on top is the bridge from the label: the pointer reaches the popover without leaving it. -->
        <div class="bridge" (pointerenter)="pin()" (pointerleave)="onPointerLeave()">
          <section
            #popover
            class="popover"
            role="dialog"
            [id]="uid"
            [attr.aria-labelledby]="uid + '-title'"
            [attr.aria-describedby]="uid + '-body'"
            data-cy="feature-tour-teaser-popover"
            cdkTrapFocus
            [cdkTrapFocusAutoCapture]="focusOnOpen()">
            <span class="arrow" aria-hidden="true"></span>
            <div class="head">
              <h2 [id]="uid + '-title'" class="title">{{ titleKey() | translate }}</h2>
              <button
                mat-icon-button
                type="button"
                class="close"
                data-cy="feature-tour-teaser-close"
                [attr.aria-label]="'ui.featureTour.closeTeaser' | translate"
                (click)="close()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <p [id]="uid + '-body'" class="body">{{ bodyKey() | translate }}</p>
            <div class="footer">
              <button mat-button type="button" data-cy="feature-tour-teaser-dismiss" (click)="dismiss()">
                {{ 'ui.featureTour.dismiss' | translate }}
              </button>
              <button
                mat-flat-button
                color="primary"
                type="button"
                data-cy="feature-tour-teaser-start"
                cdkFocusInitial
                (click)="start()">
                {{ 'ui.featureTour.start' | translate }}
              </button>
            </div>
          </section>
        </div>
      </ng-template>
    }
  `,
  styleUrl: './feature-tour-teaser.component.css',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, MatButton, MatIconButton, MatIcon, TranslatePipe],
})
export class FeatureTourTeaserComponent {
  /** The tour the teaser leads to. */
  readonly tour = input.required<FeatureTourName>();
  /** The label's accessible name: what is new where. */
  readonly labelKey = input.required<string>();
  readonly titleKey = input.required<string>();
  readonly bodyKey = input.required<string>();

  /** "Start tour": the host takes the user to the tour's page, where the tour opens right away. */
  readonly started = output<void>();

  readonly uid = `feature-tour-teaser-${nextInstance++}`;

  readonly positions: ConnectedPosition[] = [
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
  ];

  readonly visible = computed(() => {
    const tour = FEATURE_TOURS[this.tour()];
    return this._tourService.shouldShow(tour) && !this._tourService.wasVisited(tour);
  });

  readonly hovered = signal(false);
  /** Open until closed, once clicked or entered. */
  readonly pinned = signal(false);
  readonly open = computed(() => this.hovered() || this.pinned());
  /** Whether the popover takes focus as it opens: only when opened from the keyboard. */
  readonly focusOnOpen = signal(false);

  private readonly _tourService = inject(FeatureTourService);
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _trap = viewChild(CdkTrapFocus);
  private readonly _label = viewChild<ElementRef<HTMLButtonElement>>('label');
  private readonly _popover = viewChild<ElementRef<HTMLElement>>('popover');
  private _closeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this._cancelClose());
  }

  onPointerEnter(): void {
    this._cancelClose();
    this.hovered.set(true);
  }

  onPointerLeave(): void {
    this._cancelClose();
    this._closeTimer = setTimeout(() => this.hovered.set(false), TEASER_CLOSE_GRACE_MS);
  }

  pin(): void {
    this._cancelClose();
    this.pinned.set(true);
  }

  onClick(event: MouseEvent): void {
    // The label sits inside a link (a tab): the click must not follow it.
    event.preventDefault();
    event.stopPropagation();
    const fromKeyboard = event.detail === 0;
    if (this.pinned() && !fromKeyboard) {
      this.close();
      return;
    }
    const wasOpen = this.open();
    this.focusOnOpen.set(fromKeyboard);
    this.pin();
    if (fromKeyboard && wasOpen) {
      this._trap()?.focusTrap.focusInitialElementWhenReady();
    }
  }

  onLabelKeydown(event: KeyboardEvent): void {
    // Enter and Space press the label, not the tab around it.
    if (event.keyCode === ENTER || event.keyCode === SPACE) {
      event.stopPropagation();
    } else if (event.keyCode === ESCAPE && this.open()) {
      event.stopPropagation();
      this.close();
    }
  }

  onPopoverKeydown(event: KeyboardEvent): void {
    if (event.keyCode === ESCAPE) {
      event.preventDefault();
      this.close();
    }
  }

  /** Closes the popover; the label stays. */
  close(): void {
    this._cancelClose();
    const focusInside = this._focusInPopover();
    this.hovered.set(false);
    this.pinned.set(false);
    this.focusOnOpen.set(false);
    if (focusInside) {
      this._label()?.nativeElement.focus();
    }
  }

  /** "No thanks": neither this label, nor the tour, nor the tours that follow it show again. */
  dismiss(): void {
    this.close();
    const tour = FEATURE_TOURS[this.tour()];
    Object.values(FEATURE_TOURS)
      .filter((other: FeatureTour) => other === tour || other.follows === tour.id)
      .forEach(other => this._tourService.markSeen(other));
    // The label is gone; focus goes to what it sat in rather than to the page's start.
    this._host.nativeElement.parentElement?.closest<HTMLElement>('a[href], button, [tabindex]')?.focus();
  }

  start(): void {
    this.close();
    this._tourService.startNow(FEATURE_TOURS[this.tour()]);
    this.started.emit();
  }

  private _cancelClose(): void {
    clearTimeout(this._closeTimer);
    this._closeTimer = undefined;
  }

  private _focusInPopover(): boolean {
    const popover = this._popover()?.nativeElement;
    return !!popover && popover.contains(popover.ownerDocument.activeElement);
  }
}
