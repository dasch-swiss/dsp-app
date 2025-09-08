import { ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { KnoraApiConnection, ListNodeV2, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-list-value',
  template: `
    @if (listRootNode) {
      <app-nested-menu
        style="flex: 1"
        [data]="listRootNode"
        [selection]="mySelectedNode?.label"
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

  listRootNode: ListNodeV2 | undefined;
  mySelectedNode: ListNodeV2 | undefined;

  updating = false;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.control.valueChanges.pipe(startWith(this.control.value)).subscribe(value => {
      if (this.updating) return;

      this._loadRootNodes();
    });
  }

  selectedNode(node: ListNodeV2) {
    this._selectNode(node);
    const valueToPatch = this.mySelectedNode?.id ? this.mySelectedNode.id : '';

    this.updating = true;
    this.control.patchValue(valueToPatch);
    this.updating = false;
  }

  private _selectNode(node: ListNodeV2): void {
    this.mySelectedNode = node;
  }

  private _loadRootNodes(): void {
    const rootNodeIris = this.propertyDef.guiAttributes;
    for (const rootNodeIri of rootNodeIris) {
      const trimmedRootNodeIRI = rootNodeIri.substring(7, rootNodeIri.length - 1);
      this._dspApiConnection.v2.list.getList(trimmedRootNodeIRI).subscribe(response => {
        // TODO weird to have n subscribes inside ngFors
        this.listRootNode = response as ListNodeV2;
        const found = this._lookForNode(response as ListNodeV2);
        if (!found) {
          this.mySelectedNode = undefined;
        }
        this._cd.detectChanges();
      });
    }
  }

  private _lookForNode(response: ListNodeV2): boolean {
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
