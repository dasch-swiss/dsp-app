import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KnoraApiConnection, ReadResource, ReadValue } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import {
  PropertiesDisplayService,
  PropertyValuesComponent,
  ResourceFetcherService,
} from '@dasch-swiss/vre/resource-editor/resource-editor';
import { filterUndefined, generateDspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { skip } from 'rxjs';
import { TableRowFetcherRegistry } from './row-fetcher-registry.service';
import { interceptStaleValueUpdates } from './stale-value-update';

/** What `PropertyValuesComponent` needs on its two inputs, built once per resource. */
interface EditorInputs {
  readonly myProperty: PropertyInfoValues;
  readonly editModeData: { resource: ReadResource; values: ReadValue[] };
}

/**
 * Hosts the resource editor's own property editor inside one table cell.
 *
 * The cell does not reimplement editing; it mounts `<app-property-values>`, which brings the
 * value-type editor switcher, validation, cardinality rules, the comment control, the delete
 * dialog and the write path with it. An edit made here and the same edit made in the right-hand
 * viewer are therefore the same code, not two implementations that agree today (PRD §6).
 *
 * That component provides `PropertyValueService` for itself and initialises it from its inputs,
 * but its subtree also injects two services it does not provide — `PropertiesDisplayService`,
 * which this component provides in the ordinary way, and `ResourceFetcherService`, which it cannot,
 * because the right instance depends on which row this cell is in and a `providers:` array cannot
 * depend on a component's own inputs. Hence `ngComponentOutlet` with an injector built in
 * `ngOnInit`: it is the one way to choose a provider per instance without reaching into the child.
 *
 * Mounted only while its cell is open, so a page of a wide class costs nothing until the user
 * edits something (REQ-4.13).
 */
@Component({
  selector: 'app-table-row-edit-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, TranslatePipe],
  providers: [PropertiesDisplayService],
  template: `
    @if (editorInputs(); as inputs) {
      <ng-container
        [ngComponentOutlet]="editorComponent"
        [ngComponentOutletInputs]="inputs"
        [ngComponentOutletInjector]="editorInjector" />
    } @else {
      <span class="editor-unavailable">{{ 'pages.dataBrowser.table.cellNotEditable' | translate }}</span>
    }
  `,
  styleUrl: './table-row-edit-host.component.scss',
})
export class TableRowEditHostComponent implements OnInit {
  /** The row's resource, fetched in full by the table's batch step so it carries `entityInfo`. */
  readonly resource = input.required<ReadResource>();
  readonly propertyIri = input.required<string>();

  /**
   * The row's resource as dsp-api now holds it, after the editor saved something.
   *
   * The table re-renders the row from this and does *not* re-run the result query, which is what
   * keeps a saved row in place even once its new value contradicts the active sort or filter
   * (REQ-4.4, REQ-4.5).
   */
  readonly resourceReloaded = output<ReadResource>();

  protected readonly editorComponent = PropertyValuesComponent;
  protected editorInjector!: Injector;

  private readonly _registry = inject(TableRowFetcherRegistry);
  private readonly _injector = inject(Injector);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _connection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);

  /**
   * The resource the editor is bound to.
   *
   * Held here rather than read from the `resource` input, and advanced only by a reload. Rebinding
   * `editModeData` resets `PropertyValueService.lastOpenedItem$` — that is how a save returns the
   * cell to display mode — so binding it to an input the table may touch for unrelated reasons
   * would close the editor under the user mid-edit.
   */
  private readonly _current = signal<ReadResource | null>(null);

  /**
   * Memoised on `_current`, and that matters: `NgComponentOutlet` calls `setInput` for every key
   * whose value changed, so an object rebuilt per change-detection pass would reset the editor to
   * display mode on every pass and make the cell impossible to type in.
   */
  protected readonly editorInputs = computed<EditorInputs | null>(() => {
    const resource = this._current();
    if (!resource) {
      return null;
    }

    // `generateDspResource` runs the same `GenerateProperty.commonProperty` the viewer runs, so a
    // property it drops — link, file value, geometry — yields nothing here. Those columns carry no
    // edit affordance in the first place (REQ-4.7); the null branch covers a resource whose
    // `entityInfo` disagrees with the ontology the column model was built from.
    const myProperty = generateDspResource(resource).resProps.find(prop => prop.propDef.id === this.propertyIri());
    return myProperty ? { myProperty, editModeData: { resource, values: myProperty.values } } : null;
  });

  ngOnInit() {
    const resource = this.resource();
    this._current.set(resource);

    const fetcher = this._registry.fetcherFor(resource.id);

    this.editorInjector = Injector.create({
      // The component's own node injector, so the subtree still reaches everything it normally
      // does — `ActivatedRoute` for `?highlightValue`, `MatDialog` for the delete dialog, and this
      // component's `PropertiesDisplayService`.
      parent: this._injector,
      providers: [
        { provide: ResourceFetcherService, useValue: fetcher },
        {
          provide: DspApiConnectionToken,
          useValue: interceptStaleValueUpdates(this._connection, () => this._onStaleRejection(fetcher)),
        },
      ],
    });

    fetcher.resource$
      .pipe(
        filterUndefined(),
        // Drop the value the fetcher already holds. On a first open that is the seeding fetch, and
        // on a second cell in the same row it is the cached resource; in both cases it is what the
        // editor is already bound to, and rebinding it would close an editor the user had just
        // opened. Everything after it is a reload, which is a save or a stale recovery.
        skip(1),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(reloaded => {
        this._current.set(reloaded.res);
        this.resourceReloaded.emit(reloaded.res);
      });
  }

  /**
   * Someone else changed this value since the page was fetched (REQ-4.10).
   *
   * The reload is what makes the cell usable again: the editor is holding a value IRI dsp-api has
   * superseded, so every further save from it would be rejected the same way. Reloading replaces
   * `editModeData` with the current values, which also returns the cell to display mode — the
   * user's text is deliberately not preserved, because it was written against a value that no
   * longer exists and re-applying it blind would silently overwrite the other edit.
   */
  private _onStaleRejection(fetcher: ResourceFetcherService): void {
    this._notification.openSnackBar(this._translate.instant('pages.dataBrowser.table.editNotApplied'), 'error');
    fetcher.reload();
  }
}
