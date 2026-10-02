import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Predicate, StatementElement } from '../../model';
import { StatementDraftStore } from '../../service/statement-draft.store';
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
    TranslateModule,
  ],
  template: `
    <button mat-stroked-button cdkOverlayOrigin #trigger="cdkOverlayOrigin" (click)="onAdd()">
      <mat-icon>add</mat-icon>
      {{ 'pages.search.advancedSearch.addFilter' | translate }}
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
          (filterConfirm)="onConfirm()"
          (filterCancel)="onCancel()" />
      </ng-template>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFilterButtonComponent {
  @Output() filterConfirmed = new EventEmitter<string>();

  private readonly _draftStore = inject(StatementDraftStore);
  private readonly _changeDetector = inject(ChangeDetectorRef);

  readonly positions = CHIP_POPOVER_POSITIONS;
  pendingStatement: StatementElement | null = null;

  onAdd(): void {
    if (!this.pendingStatement) {
      this.pendingStatement = this._draftStore.addBlankStatement();
    }
  }

  /**
   * Open the editor on a blank filter whose property is already chosen.
   *
   * Called imperatively by the bar when something outside it — a Data tab column header — names the
   * property to filter on, so the user lands on the operator and value rather than re-stating which
   * column they were already looking at (PRD REQ-3.5).
   *
   * `markForCheck` is not optional here. `pendingStatement` is a plain field, and the only thing
   * that normally dirties this `OnPush` component is its own click binding; invoked from a caller in
   * another part of the tree, the overlay would stay closed until some unrelated event happened to
   * re-render the bar.
   */
  openFor(predicate: Predicate): void {
    this.onAdd();
    if (this.pendingStatement) {
      this._draftStore.setSelectedPredicate(this.pendingStatement, predicate);
    }
    this._changeDetector.markForCheck();
  }

  onConfirm(): void {
    if (this.pendingStatement) {
      // Promote the in-progress filter (and its subtree) from editing to confirmed, then let the bar
      // project it as a chip and persist it to the URL.
      this._draftStore.commitNewFilter(this.pendingStatement);
      this.filterConfirmed.emit(this.pendingStatement.id);
      this.pendingStatement = null;
    }
  }

  onCancel(): void {
    if (this.pendingStatement) {
      this._draftStore.deleteStatement(this.pendingStatement);
      this.pendingStatement = null;
    }
  }
}
