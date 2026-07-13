import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { map } from 'rxjs';
import { OntologyDataService } from '../../service/ontology-data.service';
import { SearchUrlSyncService } from '../../service/search-url-sync.service';
import { getLabel } from '../../util/labels';
import { CHIP_POPOVER_POSITIONS } from './chip-bar.helpers';

@Component({
  selector: 'app-data-model-chip',
  standalone: true,
  // Collapse the host to `display: none` when the picker is hidden (single data model). Otherwise the
  // empty host stays a flex item in `.chip-bar` and its `gap` shifts the first visible chip ~8px, which
  // silently mis-aligns the chip row against the input above. `@if` alone leaves a comment placeholder,
  // so the host box (and its gap) would remain without this. Host bindings cannot use pipes, so this
  // reads the `showChip` signal rather than `showChip$ | async`.
  host: { '[style.display]': "showChip() ? null : 'none'" },
  imports: [
    AsyncPipe,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    OverlayModule,
  ],
  template: `
    <!-- With a single data model there is nothing to switch between, so the picker is hidden entirely
         (the sole ontology is still selected under the hood — this only removes the redundant control). -->
    @if (showChip$ | async) {
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 11px; color: rgba(0,0,0,0.6); margin-bottom: 2px;">Data Model</span>
        <button mat-stroked-button cdkOverlayOrigin #trigger="cdkOverlayOrigin" (click)="isOpen = !isOpen">
          {{ ontologyLabel$ | async }}
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
      </div>

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
          [hideSingleSelectionIndicator]="true"
          (selectionChange)="onOntologySelected($event.options[0]?.value)">
          @for (onto of ontologies$ | async; track onto.iri) {
            <mat-list-option [value]="onto.iri" [selected]="onto.iri === (selectedOntologyIri$ | async)">
              {{ getLabel(onto.labels) }}
            </mat-list-option>
          }
        </mat-selection-list>
      </ng-template>
    }
  `,
  styles: [
    `
      .chip-popover-list {
        background: white;
        min-width: 200px;
        max-height: 300px;
        overflow-y: auto;
        border-radius: 4px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataModelChipComponent {
  readonly getLabel = getLabel;
  private readonly _dataService = inject(OntologyDataService);
  private readonly _urlSync = inject(SearchUrlSyncService);

  readonly positions = CHIP_POPOVER_POSITIONS;
  isOpen = false;

  readonly ontologies$ = this._dataService.ontologies$;
  // Only show the picker when there is more than one data model to choose from; a single model needs no control.
  readonly showChip$ = this.ontologies$.pipe(map(ontologies => ontologies.length > 1));
  // Signal mirror of `showChip$` for the host `display` binding (host bindings cannot use the async pipe).
  readonly showChip = toSignal(this.showChip$, { initialValue: false });
  readonly ontologyLabel$ = this._dataService.selectedOntology$.pipe(map(o => (o ? o.label : '…')));
  readonly selectedOntologyIri$ = this._dataService.selectedOntology$.pipe(map(o => o?.id ?? null));

  onOntologySelected(iri: string): void {
    if (!iri) return;
    this._dataService.setOntology(iri);
    // Changing the ontology resets class/filters/orderBy in the URL; the ephemeral tree reseeds
    // from searchState$.
    this._urlSync.writeState(
      { ontology: iri, class: undefined, filters: undefined, orderBy: undefined },
      { replaceUrl: false }
    );
    this.isOpen = false;
  }
}
