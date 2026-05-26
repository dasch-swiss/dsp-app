import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { map } from 'rxjs';
import { OntologyDataService } from '../../service/ontology-data.service';
import { SearchStateService } from '../../service/search-state.service';
import { CHIP_POPOVER_POSITIONS } from './chip-bar.helpers';

@Component({
  selector: 'app-data-model-chip',
  standalone: true,
  imports: [AsyncPipe, CdkConnectedOverlay, CdkOverlayOrigin, MatButtonModule, MatIconModule, MatListModule, OverlayModule],
  template: `
    <button mat-stroked-button cdkOverlayOrigin #trigger="cdkOverlayOrigin" (click)="isOpen = !isOpen">
      <mat-icon>schema</mat-icon>
      {{ ontologyLabel$ | async }}
      <mat-icon>arrow_drop_down</mat-icon>
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="isOpen = false">
      <mat-selection-list
        class="chip-popover-list mat-elevation-z4"
        [multiple]="false"
        (selectionChange)="onOntologySelected($event.options[0]?.value)">
        @for (onto of ontologies$ | async; track onto.iri) {
          <mat-list-option [value]="onto.iri" [selected]="onto.iri === (selectedOntologyIri$ | async)">
            {{ onto.label }}
          </mat-list-option>
        }
      </mat-selection-list>
    </ng-template>
  `,
  styles: [`
    .chip-popover-list {
      background: white;
      min-width: 200px;
      max-height: 300px;
      overflow-y: auto;
      border-radius: 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataModelChipComponent {
  private readonly _dataService = inject(OntologyDataService);
  private readonly _searchStateService = inject(SearchStateService);

  readonly positions = CHIP_POPOVER_POSITIONS;
  isOpen = false;

  readonly ontologies$ = this._dataService.ontologies$;
  readonly ontologyLabel$ = this._dataService.selectedOntology$.pipe(map(o => o?.label ?? '…'));
  readonly selectedOntologyIri$ = this._dataService.selectedOntology$.pipe(map(o => o?.id ?? null));

  onOntologySelected(iri: string): void {
    if (!iri) return;
    this._dataService.setOntology(iri);
    this._searchStateService.clearAllSelections();
    this.isOpen = false;
  }
}
