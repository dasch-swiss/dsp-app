import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StatementElement } from '../../model';
import { PropertyFormManager } from '../../service/property-form.manager';
import { CHIP_POPOVER_POSITIONS } from './chip-bar.helpers';
import { FilterEditorPopoverComponent } from './filter-editor-popover.component';

@Component({
  selector: 'app-add-filter-button',
  standalone: true,
  imports: [
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    FilterEditorPopoverComponent,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
  ],
  template: `
    <button mat-stroked-button cdkOverlayOrigin #trigger="cdkOverlayOrigin" (click)="onAdd()">
      <mat-icon>add</mat-icon>
      Add filter
    </button>

    @if (pendingStatement) {
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="trigger"
        [cdkConnectedOverlayOpen]="true"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        (backdropClick)="onCancel()">
        <app-filter-editor-popover
          [statement]="pendingStatement"
          [isPristine]="true"
          (confirm)="onConfirm()"
          (cancel)="onCancel()" />
      </ng-template>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFilterButtonComponent {
  @Output() filterConfirmed = new EventEmitter<string>();

  private readonly _formManager = inject(PropertyFormManager);

  readonly positions = CHIP_POPOVER_POSITIONS;
  pendingStatement: StatementElement | null = null;

  onAdd(): void {
    if (!this.pendingStatement) {
      this.pendingStatement = this._formManager.addBlankStatement();
    }
  }

  onConfirm(): void {
    if (this.pendingStatement) {
      this.filterConfirmed.emit(this.pendingStatement.id);
      this.pendingStatement = null;
    }
  }

  onCancel(): void {
    if (this.pendingStatement) {
      this._formManager.deleteStatement(this.pendingStatement);
      this.pendingStatement = null;
    }
  }
}
