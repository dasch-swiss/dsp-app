import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { StatementElement } from '../../model';
import { PropertyFormManager } from '../../service/property-form.manager';
import { CHIP_POPOVER_POSITIONS, cloneStatementElement } from './chip-bar.helpers';
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
        [highlighted]="isOpen"
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
      <app-filter-editor-popover [statement]="statement" />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterChipComponent {
  @Input({ required: true }) statement!: StatementElement;
  @Input() isOpen = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() remove = new EventEmitter<void>();

  private readonly _formManager = inject(PropertyFormManager);
  private _snapshotBeforeEdit?: StatementElement;

  readonly positions = CHIP_POPOVER_POSITIONS;

  onOpen(): void {
    this._snapshotBeforeEdit = cloneStatementElement(this.statement);
    this.openChange.emit(true);
  }

  onBackdropClick(): void {
    if (this._snapshotBeforeEdit) {
      this._formManager.restoreStatement(this._snapshotBeforeEdit, this.statement);
      this._snapshotBeforeEdit = undefined;
    }
    this.openChange.emit(false);
  }
}
