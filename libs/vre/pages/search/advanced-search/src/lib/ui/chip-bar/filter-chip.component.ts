import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { StatementElement } from '../../model';
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
    MatChipsModule,
    MatIconModule,
    OverlayModule,
  ],
  template: `
    <mat-chip-set>
      <mat-chip
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        [highlighted]="isOpen || !isValid"
        style="margin: 0 8px"
        [color]="isValid ? undefined : 'warn'"
        (click)="onOpen()">
        {{ statement | chipLabel }}
        <button matChipRemove aria-label="Remove filter" (click)="$event.stopPropagation(); remove.emit()">
          <mat-icon>cancel</mat-icon>
        </button>
      </mat-chip>
    </mat-chip-set>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="onBackdropClick()">
      <app-filter-editor-popover
        [statement]="statement"
        [isPristine]="statement.isPristine"
        (confirm)="confirm.emit()"
        (cancel)="cancel.emit()" />
    </ng-template>
  `,
  styles: [
    `
      app-filter-chip .mdc-evolution-chip__text-label {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: unset !important;
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
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  readonly positions = CHIP_POPOVER_POSITIONS;

  onOpen(): void {
    this.openChange.emit(true);
  }

  onBackdropClick(): void {
    this.openChange.emit(false);
  }
}
