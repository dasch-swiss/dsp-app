import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  Input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { KnoraApiConnection, ListNodeV2WithAllLanguages, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { combineLatest } from 'rxjs';
import { filter, startWith, switchMap } from 'rxjs/operators';
import { NestedMenuComponent } from './nested-menu.component';

const HLIST_PREFIX = 'hlist=<';

@Component({
  selector: 'app-list-value',
  imports: [NestedMenuComponent, MatError, HumanReadableErrorPipe],
  template: `
    @if (listRootNode) {
      <app-nested-menu
        style="flex: 1"
        [data]="listRootNode"
        [selection]="mySelectedNode?.labels ?? []"
        (selectedNode)="selectedNode($event)" />
    }
    @if (control.touched && control.errors) {
      <mat-error>{{ control.errors | humanReadableError }}</mat-error>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListValueComponent implements OnInit {
  @Input({ required: true }) propertyDef!: ResourcePropertyDefinition;
  @Input({ required: true }) control!: FormControl<string | null>;

  listRootNode: ListNodeV2WithAllLanguages | undefined;
  mySelectedNode: ListNodeV2WithAllLanguages | undefined;

  updating = false;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _cd: ChangeDetectorRef,
    private _localizationService: LocalizationService,
    private _destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    const rootIri = this._rootNodeIri();
    if (!rootIri) return; // no list configured on this property → nothing to fetch

    // One subscription for the component's lifetime. control.valueChanges drives
    // the data fetch via switchMap (cancelling any in-flight fetch when the value
    // changes), and combineLatest with currentLanguage$ re-emits on language
    // change so the nested menu re-renders in the active language. The
    // `updating` gate short-circuits BEFORE the fetch so a programmatic
    // patchValue (from selectedNode) doesn't trigger a redundant GET.
    this.control.valueChanges
      .pipe(
        startWith(this.control.value),
        filter(() => !this.updating),
        switchMap(() =>
          combineLatest([
            this._dspApiConnection.v2.list.getListWithAllLanguages(rootIri),
            this._localizationService.currentLanguage$,
          ])
        ),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe(([response]) => {
        this.listRootNode = response;
        const found = this._lookForNode(response);
        if (!found) {
          this.mySelectedNode = undefined;
        }
        this._cd.markForCheck();
      });
  }

  selectedNode(node: ListNodeV2WithAllLanguages) {
    this._selectNode(node);
    const valueToPatch = this.mySelectedNode?.id ? this.mySelectedNode.id : '';

    this.updating = true;
    this.control.patchValue(valueToPatch);
    this.updating = false;
  }

  private _selectNode(node: ListNodeV2WithAllLanguages): void {
    this.mySelectedNode = node;
  }

  private _rootNodeIri(): string | undefined {
    // guiAttributes[0] has shape `hlist=<iri>` for a list-value property.
    const raw = this.propertyDef.guiAttributes[0];
    if (!raw?.startsWith(HLIST_PREFIX) || !raw.endsWith('>')) return undefined;
    return raw.substring(HLIST_PREFIX.length, raw.length - 1);
  }

  private _lookForNode(response: ListNodeV2WithAllLanguages): boolean {
    if (response.id === this.control.value) {
      this._selectNode(response);
      return true;
    }

    for (const child of response.children) {
      const found = this._lookForNode(child);
      if (found) {
        return true;
      }
    }
    return false;
  }
}
