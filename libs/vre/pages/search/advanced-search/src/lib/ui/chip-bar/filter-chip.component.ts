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
      style="margin: 0 8px"
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
      <app-filter-editor-popover
        [statement]="draft() ?? statement"
        [isPristine]="statement.isPristine"
        (filterConfirm)="onConfirm()"
        (filterCancel)="onCancel()" />
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
  readonly draft = signal<StatementElement | null>(null);
  private readonly _draftStore = inject(StatementDraftStore);

  onOpen(): void {
    this.draft.set(StatementElement.detachedClone(this.statement));
    this.openChange.emit(true);
  }

  onConfirm(): void {
    const d = this.draft();
    if (d) {
      this._draftStore.restoreStatement(d, this.statement);
    }
    this.draft.set(null);
    this.filterConfirm.emit();
  }

  onCancel(): void {
    this.draft.set(null);
    this.filterCancel.emit();
  }

  onBackdropClick(): void {
    this.draft.set(null);
    this.filterCancel.emit();
    this.openChange.emit(false);
  }
}
