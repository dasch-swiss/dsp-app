import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StatementElement } from '../../model';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { CHIP_POPOVER_POSITIONS } from './chip-bar.helpers';
import { ChipLabelPipe } from './chip-label.pipe';
import { FilterEditorPopoverComponent } from './filter-editor-popover.component';

@Component({
  selector: 'app-filter-chip',
  standalone: true,
  imports: [
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    ChipLabelPipe,
    FilterEditorPopoverComponent,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
  ],
  template: `
    <button
      mat-stroked-button
      cdkOverlayOrigin
      #trigger="cdkOverlayOrigin"
      class="filter-chip-button"
      [class.filter-chip-button--invalid]="!isValid"
      [color]="isValid ? 'primary' : 'warn'"
      (click)="onOpen()">
      {{ statement | chipLabel }}
      <mat-icon
        class="filter-chip-button__remove"
        aria-label="Remove filter"
        (click)="$event.stopPropagation(); remove.emit()">
        cancel
      </mat-icon>
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="onBackdropClick()">
      @if (draft(); as d) {
        <app-filter-editor-popover
          [statement]="d"
          [isPristine]="d.isPristine"
          (filterConfirm)="onConfirm()"
          (filterCancel)="onCancel()" />
      }
    </ng-template>
  `,
  styles: [
    `
      /* The trailing remove (✕) icon sits inside the button; nudge it so it reads as a clear affordance
         and gains a subtle hover without the button's own ripple hiding it. */
      app-filter-chip .filter-chip-button__remove {
        margin-left: 4px;
        cursor: pointer;
        opacity: 0.7;
      }
      app-filter-chip .filter-chip-button__remove:hover {
        opacity: 1;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChipComponent {
  @Input({ required: true }) statement!: StatementElement;
  @Input() isOpen = false;
  @Input() isValid = true;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() remove = new EventEmitter<void>();
  @Output() filterConfirm = new EventEmitter<void>();
  @Output() filterCancel = new EventEmitter<void>();

  readonly positions = CHIP_POPOVER_POSITIONS;
  private readonly _draftStore = inject(StatementDraftStore);

  // The isolated editing clone shown in the popover. Null when closed. Editing it does not touch the
  // displayed chip (`statement`) until confirmed — the clone lives separately in the draft store.
  readonly draft = signal<StatementElement | null>(null);

  onOpen(): void {
    this.draft.set(this._draftStore.beginEdit(this.statement));
    this.openChange.emit(true);
  }

  onConfirm(): void {
    const d = this.draft();
    // Only emit filterConfirm (which persists to the URL) when the edit actually committed. If a URL
    // navigation reseeded the store mid-edit, the clone is orphaned and commitEdit is a no-op — emitting
    // would then write the reseeded set, silently discarding the edit. In that case just close.
    const committed = d ? this._draftStore.commitEdit(d, this.statement) : false;
    this.draft.set(null);
    if (committed) {
      this.filterConfirm.emit();
    } else {
      this.filterCancel.emit();
    }
  }

  onCancel(): void {
    this._discardDraft();
    this.filterCancel.emit();
  }

  onBackdropClick(): void {
    this._discardDraft();
    this.filterCancel.emit();
    this.openChange.emit(false);
  }

  private _discardDraft(): void {
    const d = this.draft();
    if (d) this._draftStore.cancelEdit(d);
    this.draft.set(null);
  }
}
