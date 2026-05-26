import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { map } from 'rxjs';
import { SEARCH_ALL_RESOURCE_CLASSES_OPTION } from '../../constants';
import { IriLabelPair } from '../../model';
import { OntologyDataService } from '../../service/ontology-data.service';
import { PropertyFormManager } from '../../service/property-form.manager';
import { SearchStateService } from '../../service/search-state.service';
import { CHIP_POPOVER_POSITIONS } from './chip-bar.helpers';

@Component({
  selector: 'app-resource-class-chip',
  standalone: true,
  imports: [AsyncPipe, CdkConnectedOverlay, CdkOverlayOrigin, MatButtonModule, MatIconModule, MatListModule, OverlayModule],
  template: `
    <button mat-stroked-button cdkOverlayOrigin #trigger="cdkOverlayOrigin" (click)="isOpen = !isOpen">
      <mat-icon>category</mat-icon>
      {{ classLabel$ | async }}
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
        (selectionChange)="onClassSelected($event.options[0]?.value)">
        <mat-list-option [value]="allOption" [selected]="(selectedClassIri$ | async) === ''">
          All resource classes
        </mat-list-option>
        @for (cls of resourceClasses$ | async; track cls.iri) {
          <mat-list-option [value]="cls" [selected]="cls.iri === (selectedClassIri$ | async)">
            {{ cls.label }}
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
export class ResourceClassChipComponent {
  private readonly _dataService = inject(OntologyDataService);
  private readonly _searchStateService = inject(SearchStateService);
  private readonly _formManager = inject(PropertyFormManager);

  readonly positions = CHIP_POPOVER_POSITIONS;
  readonly allOption = SEARCH_ALL_RESOURCE_CLASSES_OPTION;
  isOpen = false;

  readonly resourceClasses$ = this._dataService.resourceClasses$;
  readonly classLabel$ = this._searchStateService.selectedResourceClass$.pipe(
    map(rc => (rc?.iri ? rc.label : 'All resource classes'))
  );
  readonly selectedClassIri$ = this._searchStateService.selectedResourceClass$.pipe(map(rc => rc?.iri ?? ''));

  onClassSelected(selection: IriLabelPair): void {
    if (!selection) return;
    if (selection.iri === '') {
      this._searchStateService.clearAllSelections();
    } else {
      this._formManager.setMainResource(selection);
    }
    this.isOpen = false;
  }
}
