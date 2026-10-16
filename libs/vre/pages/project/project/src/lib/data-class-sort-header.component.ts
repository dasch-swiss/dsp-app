import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Constants } from '@dasch-swiss/dsp-js';
import { OntologyDataService, Predicate, RDFS_LABEL } from '@dasch-swiss/vre/pages/search/search-filters';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe } from '@ngx-translate/core';
import { map, of, switchMap } from 'rxjs';
import { DataClassUrlStateService } from './data-class-url-state.service';

/** A property the list can be ordered by, flattened for the template. */
interface SortOption {
  iri: string;
  label: string;
}

/**
 * The sort control above the list: which property to order by, and in which direction.
 *
 * Sorting by a property reorders the class without filtering it: the query binds the sort property
 * with `OPTIONAL`, so resources that do not carry it stay in the results and the count is unchanged.
 * They cluster at one end, since an unbound value sorts first ascending.
 *
 * Returning to page 0 is not done here. Changing the sort changes the query, and the fetcher already
 * resets the offset whenever the query changes; a second writer would leave no way to tell which won.
 */
@Component({
  selector: 'app-data-class-sort-header',
  template: `
    @let descending = isDescending();
    @let current = currentOption();

    <div role="columnheader" [attr.aria-sort]="descending ? 'descending' : 'ascending'" class="sort-header">
      <span class="sort-by">{{ 'pages.dataBrowser.sortHeader.sortBy' | translate }}</span>

      <button
        type="button"
        class="property-trigger"
        data-cy="sort-property-trigger"
        [matMenuTriggerFor]="propertyMenu"
        [attr.aria-label]="'pages.dataBrowser.sortHeader.chooseProperty' | translate">
        <span class="property-name">{{ current.label }}</span>
        <mat-icon class="caret">arrow_drop_down</mat-icon>
      </button>

      <button
        type="button"
        class="direction-toggle"
        data-cy="sort-direction-toggle"
        [attr.aria-label]="
          (descending ? 'pages.dataBrowser.sortHeader.sortAscending' : 'pages.dataBrowser.sortHeader.sortDescending')
            | translate
        "
        (click)="toggleDirection()">
        <mat-icon class="sort-icon">{{ descending ? 'arrow_downward' : 'arrow_upward' }}</mat-icon>
      </button>
    </div>

    <mat-menu #propertyMenu="matMenu">
      @for (option of sortOptions(); track option.iri) {
        <button mat-menu-item type="button" (click)="selectProperty(option.iri)">{{ option.label }}</button>
      }
    </mat-menu>
  `,
  styleUrl: './data-class-sort-header.component.scss',
  imports: [MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, TranslatePipe],
  providers: [StringifyStringLiteralPipe],
})
export class DataClassSortHeaderComponent {
  private readonly _urlState = inject(DataClassUrlStateService);
  private readonly _ontology = inject(OntologyDataService);
  private readonly _stringify = inject(StringifyStringLiteralPipe);

  readonly isDescending = toSignal(this._urlState.sortDescending$.pipe(map(Boolean)), { initialValue: false });

  private readonly _sortIri = toSignal(this._urlState.sortPredicateIri$, { initialValue: RDFS_LABEL });

  private readonly _properties = toSignal(
    this._urlState.resourceClassIri$.pipe(
      switchMap(classIri => (classIri ? this._ontology.getProperties$(classIri) : of([] as Predicate[])))
    ),
    { initialValue: [] as Predicate[] }
  );

  /**
   * Link properties and list values are excluded, the same rule advanced search applies to its own
   * order-by options: ordering by a URI or by a reference to another resource is not meaningful.
   * `getProperties$` prepends the synthetic `rdfs:label` predicate, so the default is always offered.
   */
  readonly sortOptions = computed<SortOption[]>(() =>
    this._properties()
      .filter(p => !p.isLinkProperty && p.objectValueType !== Constants.ListValue)
      .map(p => ({ iri: p.iri, label: this._stringify.transform(p.labels) }))
  );

  /**
   * Falls back to a label-shaped entry while the ontology is still loading, so the control renders
   * something stable instead of flashing an empty trigger on first paint.
   */
  readonly currentOption = computed<SortOption>(() => {
    const iri = this._sortIri();
    return this.sortOptions().find(o => o.iri === iri) ?? { iri, label: '…' };
  });

  toggleDirection(): void {
    this._urlState.setSort(this._sortIri(), !this.isDescending());
  }

  /** Direction is carried over: switching the property is not a reason to silently re-sort ascending. */
  selectProperty(predicateIri: string): void {
    this._urlState.setSort(predicateIri, this.isDescending());
  }
}
