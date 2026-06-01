import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Predicate } from '../../model';
import { PropertyFormManager } from '../../service/property-form.manager';
import { SearchStateService } from '../../service/search-state.service';
import { CHIP_POPOVER_POSITIONS } from './chip-bar.helpers';
import { PropertyPickerPopoverComponent } from './property-picker-popover.component';

@Component({
  selector: 'app-add-filter-button',
  standalone: true,
  imports: [
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    MatButtonModule,
    MatIconModule,
    OverlayModule,
    PropertyPickerPopoverComponent,
  ],
  template: `
    <button mat-stroked-button cdkOverlayOrigin #trigger="cdkOverlayOrigin" (click)="isOpen = !isOpen">
      <mat-icon>add</mat-icon>
      Add filter
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="isOpen = false">
      <app-property-picker-popover
        [subjectClassIri]="currentClassIri"
        (propertySelected)="onPropertySelected($event)" />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFilterButtonComponent {
  @Output() filterAdded = new EventEmitter<string>();

  private readonly _formManager = inject(PropertyFormManager);
  private readonly _searchStateService = inject(SearchStateService);

  readonly positions = CHIP_POPOVER_POSITIONS;
  isOpen = false;

  get currentClassIri(): string | undefined {
    return this._searchStateService.currentState.selectedResourceClass?.iri || undefined;
  }

  onPropertySelected(predicate: Predicate): void {
    const blank = this._formManager.addBlankStatement();
    this._formManager.setSelectedPredicate(blank, predicate);
    this.isOpen = false;
    this.filterAdded.emit(blank.id);
  }
}
