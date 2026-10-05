import { ChangeDetectionStrategy, Component, computed, inject, input, OnChanges, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { PropertyValuesComponent, ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { DspResource, filterUndefined, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';

/**
 * One property of one resource, rendered in a table cell exactly as the resource viewer renders
 * it.
 *
 * There is no table-specific display and no table-specific editing. The cell mounts
 * `<app-property-values>`, the viewer's own unit, and that brings everything with it: the value
 * rendered through the viewer's template switcher, the hover action bubble with Info, Edit and
 * Delete, the value-type editor, validation, the comment control, the delete dialog, the add
 * control where cardinality allows one, the drag handles for reordering, and the write path. An
 * edit made in a cell and the same edit made in the panel beside it are the same code rather than
 * two implementations that agree today (PRD §6).
 *
 * The component exists at all for one reason: `app-property-values`'s subtree injects a
 * `ResourceFetcherService` it does not provide, and in a table that service has to be *this row's*
 * — it holds a resource, not any resource. A component is the only thing that can carry a
 * provider, so there is one per cell, primed from the resource the table already fetched.
 */
@Component({
  selector: 'app-table-property-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PropertyValuesComponent],
  template: ` <app-property-values [myProperty]="myProperty()" [editModeData]="editModeData()" /> `,
  styles: [
    `
      :host {
        display: block;
        /* Without this a long value stretches its column past the width the layout fixed for it:
           a flex item's default minimum size is its content. */
        min-width: 0;
      }
    `,
  ],
  // Per cell, not per table. `ResourceFetcherService` is bound to one resource — the subtree reads
  // the resource off it to build the action bubble's tooltip, and the editor calls `reload()` on
  // it after a save, which must re-read this row and no other.
  providers: [ResourceFetcherService],
})
export class TablePropertyCellComponent implements OnChanges {
  /** The row's resource as the resource editor models it, built once per row by `buildRows`. */
  readonly dspResource = input.required<DspResource>();
  /** This column's property, taken from the same `resProps` the viewer would use. */
  readonly myProperty = input.required<PropertyInfoValues>();

  /**
   * The row's resource as dsp-api holds it after the editor saved, deleted or reordered a value.
   *
   * The table overlays it onto the page the query returned and re-renders the row from it, which
   * is what keeps a saved row in place even once its new value contradicts the active sort or
   * filter (REQ-4.4, REQ-4.5).
   */
  readonly resourceReloaded = output<ReadResource>();

  /**
   * Memoised, and that is load-bearing: `PropertyValuesComponent` resets
   * `PropertyValueService.lastOpenedItem$` from `ngOnChanges`, so an object literal rebuilt per
   * change-detection pass would close the editor on every pass and make the cell impossible to
   * type in. A `computed` changes only when the row's resource does.
   */
  protected readonly editModeData = computed(() => ({
    resource: this.dspResource().res,
    values: this.myProperty().values,
  }));

  private readonly _fetcher = inject(ResourceFetcherService);

  /** What was last handed to {@link ResourceFetcherService.prime}; see the subscription below. */
  private _primed?: ReadResource;

  constructor() {
    this._fetcher.resource$.pipe(filterUndefined(), takeUntilDestroyed()).subscribe(resource => {
      // Identity, not a counter: the only emissions are our own primes and the fetcher's reloads,
      // and a reload always yields a resource object this component has never seen. Announcing a
      // prime instead would feed the table back the row it has just handed us.
      if (resource.res !== this._primed) {
        this.resourceReloaded.emit(resource.res);
      }
    });
  }

  /**
   * `ngOnChanges` rather than an `effect`, because the ordering matters: effects run *after* the
   * view is created, and the action bubble dereferences the fetcher's first emission unguarded —
   * so a cell primed one tick late throws on the resource that is still `undefined`.
   */
  ngOnChanges() {
    const resource = this.dspResource();
    this._primed = resource.res;
    this._fetcher.prime(resource);
  }
}
