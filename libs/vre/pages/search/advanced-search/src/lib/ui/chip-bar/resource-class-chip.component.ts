import { CdkConnectedOverlay, CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { LocalizationService, pickPreferredLanguageString } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { ALL_RESOURCE_CLASSES } from '../../constants';
import { IriLabelPair } from '../../model';
import { DerivedSearchStateService } from '../../service/derived-search-state.service';
import { OntologyDataService } from '../../service/ontology-data.service';
import { SearchUrlSyncService } from '../../service/search-url-sync.service';
import { StatementDraftStore } from '../../service/statement-draft.store';
import { CHIP_POPOVER_POSITIONS } from './chip-bar.helpers';

@Component({
  selector: 'app-resource-class-chip',
  standalone: true,
  imports: [
    AsyncPipe,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    OverlayModule,
    TranslateModule,
  ],
  template: `
    @let selectedIri = selectedClassIri$ | async;
    <div style="display: flex; flex-direction: column;">
      <span style="font-size: 11px; color: rgba(0,0,0,0.6); margin-bottom: 2px;">{{
        'pages.search.advancedSearch.resourceClass' | translate
      }}</span>
      <button
        mat-stroked-button
        cdkOverlayOrigin
        #trigger="cdkOverlayOrigin"
        class="resource-class-chip__button"
        [color]="selectedIri ? 'primary' : undefined"
        (click)="isOpen = !isOpen">
        {{ (classLabel$ | async) ?? ('pages.search.advancedSearch.allResourceClasses' | translate) }}
        @if (selectedIri) {
          <mat-icon
            class="resource-class-chip__remove"
            [attr.aria-label]="'pages.search.advancedSearch.tooltips.clearResourceClass' | translate"
            (click)="$event.stopPropagation(); resetToAll()">
            cancel
          </mat-icon>
        } @else {
          <mat-icon>arrow_drop_down</mat-icon>
        }
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
        (selectionChange)="onClassSelected($event.options[0]?.value)">
        <mat-list-option [value]="allOption" [selected]="(selectedClassIri$ | async) === ''">
          {{ 'pages.search.advancedSearch.allResourceClasses' | translate }}
        </mat-list-option>
        @for (cls of resourceClasses$ | async; track cls.iri) {
          <mat-list-option [value]="cls" [selected]="cls.iri === (selectedClassIri$ | async)">
            {{ pickPreferredLanguageString(cls.labels, currentLang()) }}
          </mat-list-option>
        }
      </mat-selection-list>
    </ng-template>
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
      /* This button has a trailing icon (cancel / arrow_drop_down), but because that icon sits inside a
         control-flow block it is not a direct last-child, so Material's trailing-icon rule that trims the
         right padding never matches — leaving more internal padding than the filter chip. Trim it here to
         the same value so both chips have matching internal spacing. */
      .resource-class-chip__button {
        padding-right: 8px;
      }
      /* Match the filter chip's remove (✕) icon: dimmed at rest, full-strength on hover, so both chips'
         close affordances read the same shade of primary. */
      .resource-class-chip__remove {
        cursor: pointer;
        opacity: 0.7;
      }
      .resource-class-chip__remove:hover {
        opacity: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceClassChipComponent {
  @Output() classSelected = new EventEmitter<void>();

  readonly pickPreferredLanguageString = pickPreferredLanguageString;
  private readonly _dataService = inject(OntologyDataService);
  private readonly _derivation = inject(DerivedSearchStateService);
  private readonly _draftStore = inject(StatementDraftStore);
  private readonly _urlSync = inject(SearchUrlSyncService);
  private readonly _localizationService = inject(LocalizationService);
  readonly currentLang = toSignal(this._localizationService.currentLanguage$, { initialValue: 'en' as const });

  readonly positions = CHIP_POPOVER_POSITIONS;
  readonly allOption = ALL_RESOURCE_CLASSES;
  isOpen = false;

  readonly resourceClasses$ = this._dataService.resourceClasses$;
  // The selected class is URL-derived: read it from searchState$. Emits null when no class is
  // selected; the template renders the translated "all resource classes" label in that case.
  readonly classLabel$ = this._derivation.searchState$.pipe(
    map(state =>
      state.resourceClass?.iri
        ? pickPreferredLanguageString(state.resourceClass.labels, this._localizationService.currentLanguage)
        : null
    )
  );
  readonly selectedClassIri$ = this._derivation.searchState$.pipe(map(state => state.resourceClass?.iri ?? ''));

  /** Clear the selected class and go back to "All resource classes" (same reset path as picking it in the list). */
  resetToAll(): void {
    this.onClassSelected(this.allOption);
  }

  onClassSelected(selection: IriLabelPair): void {
    if (!selection) return;
    if (selection.iri) {
      this._draftStore.setMainResource(selection);
    }
    // Nulling class/filters/orderBy in the URL is the reset; the ephemeral tree reseeds from
    // searchState$. The "all classes" branch needs no extra reset.
    this._urlSync.writeState(
      { class: selection.iri || undefined, filters: undefined, orderBy: undefined },
      { replaceUrl: false }
    );
    this.isOpen = false;
    this.classSelected.emit();
  }
}
