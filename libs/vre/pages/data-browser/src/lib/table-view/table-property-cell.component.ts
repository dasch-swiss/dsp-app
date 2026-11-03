import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import {
  PropertyValuesComponent,
  ResourceFetcherService,
  VALUE_ACTIONS_OPTIONS,
} from '@dasch-swiss/vre/resource-editor/resource-editor';
import { DspResource, filterUndefined, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';

/**
 * One property of one resource, rendered in a table cell by mounting the viewer's own
 * `<app-property-values>`, so display and editing are the viewer's code. The component exists to
 * carry a per-row `ResourceFetcherService` provider, which that subtree injects without providing.
 */
@Component({
  selector: 'app-table-property-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PropertyValuesComponent],
  template: ` <app-property-values
    [myProperty]="myProperty()"
    [editModeData]="editModeData()"
    (editingChange)="onEditingChange($event)" />`,
  styles: [
    `
      :host {
        display: block;
        /* A flex item's minimum size is its content, which would stretch the column past its fixed width. */
        min-width: 0;
      }
    `,
  ],
  // Per cell because `ResourceFetcherService` is bound to one resource and the editor's `reload()` must re-read only this row.
  // Value actions are leaner than the viewer's: creation info for signed-in users only, not repeated in the Edit tooltip.
  providers: [
    ResourceFetcherService,
    {
      provide: VALUE_ACTIONS_OPTIONS,
      useFactory: () => ({ showInfo$: inject(UserService).isLoggedIn$, creationInfoInEditTooltip: false }),
    },
  ],
})
export class TablePropertyCellComponent implements OnChanges, OnDestroy {
  /** The row's resource as the resource editor models it, built once per row by `buildRows`. */
  readonly dspResource = input.required<DspResource>();
  readonly myProperty = input.required<PropertyInfoValues>();

  /**
   * The row's resource as dsp-api holds it after the editor saved, deleted or reordered a value;
   * the table overlays it onto the page so a saved row stays in place even if it now contradicts the sort or filter.
   */
  readonly resourceReloaded = output<ReadResource>();

  /** Whether one of this cell's values is open in an editor, so the table can make room for it. */
  readonly editingChange = output<boolean>();
  private _editing = false;

  /**
   * Memoised on purpose: `PropertyValuesComponent` resets `lastOpenedItem$` from `ngOnChanges`, so
   * a literal rebuilt per pass would close the editor on every pass.
   */
  protected readonly editModeData = computed(() => ({
    resource: this.dspResource().res,
    values: this.myProperty().values,
  }));

  private readonly _fetcher = inject(ResourceFetcherService);

  private _primed?: ReadResource;

  constructor() {
    this._fetcher.resource$.pipe(filterUndefined(), takeUntilDestroyed()).subscribe(resource => {
      // Identity check: a reload always yields a resource this component has not seen, while announcing our own prime would echo the row back to the table.
      if (resource.res !== this._primed) {
        this.resourceReloaded.emit(resource.res);
      }
    });
  }

  protected onEditingChange(editing: boolean): void {
    this._editing = editing;
    this.editingChange.emit(editing);
  }

  ngOnDestroy() {
    if (this._editing) {
      this.editingChange.emit(false);
    }
  }

  /**
   * `ngOnChanges` rather than an `effect`: effects run after the view is created, and the action
   * bubble dereferences the fetcher's first emission unguarded.
   */
  ngOnChanges() {
    const resource = this.dspResource();
    this._primed = resource.res;
    this._fetcher.prime(resource);
  }
}
