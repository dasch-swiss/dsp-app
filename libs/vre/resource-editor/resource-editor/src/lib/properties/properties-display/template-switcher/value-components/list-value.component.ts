import { ChangeDetectorRef, Component, DestroyRef, Inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { MatError } from '@angular/material/form-field';
import { KnoraApiConnection, ListNodeV2WithAllLanguages, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { combineLatest } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { NestedMenuComponent } from './nested-menu.component';

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
    this.control.valueChanges.pipe(startWith(this.control.value)).subscribe(value => {
      if (this.updating) return;

      this._loadRootNodes();
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

  private _loadRootNodes(): void {
    const rootNodeIris = this.propertyDef.guiAttributes;
    for (const rootNodeIri of rootNodeIris) {
      const trimmedRootNodeIRI = rootNodeIri.substring(7, rootNodeIri.length - 1);
      // combineLatest with currentLanguage$ re-triggers CD on language change so
      // the nested menu's impure label pipe resolves against the active language.
      combineLatest([
        this._dspApiConnection.v2.list.getListWithAllLanguages(trimmedRootNodeIRI),
        this._localizationService.currentLanguage$,
      ])
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(([response]) => {
          // TODO weird to have n subscribes inside ngFors
          this.listRootNode = response;
          const found = this._lookForNode(response);
          if (!found) {
            this.mySelectedNode = undefined;
          }
          this._cd.detectChanges();
        });
    }
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
