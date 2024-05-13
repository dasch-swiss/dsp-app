import { ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { KnoraApiConnection, ListNodeV2, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';

@Component({
  selector: 'app-list-value',
  template: `
    <app-nested-menu
      style="flex: 1"
      *ngIf="listRootNode"
      [data]="listRootNode"
      [selection]="mySelectedNode?.label"
      (selectedNode)="selectedNode($event)"></app-nested-menu>
    <mat-error *ngIf="control.touched && control.errors">{{ control.errors | humanReadableError }}</mat-error>
  `,
})
export class ListValueComponent implements OnInit {
  @Input() propertyDef!: ResourcePropertyDefinition;
  @Input() control!: FormControl<string>;
  listRootNode: ListNodeV2 | undefined;
  mySelectedNode: ListNodeV2 | undefined;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._loadRootNodes();
  }

  selectedNode(node: ListNodeV2) {
    this.mySelectedNode = node;
    this.control.patchValue(node.id);
  }

  private _loadRootNodes(): void {
    const rootNodeIris = this.propertyDef.guiAttributes;
    for (const rootNodeIri of rootNodeIris) {
      const trimmedRootNodeIRI = rootNodeIri.substring(7, rootNodeIri.length - 1);
      this._dspApiConnection.v2.list.getList(trimmedRootNodeIRI).subscribe(response => {
        // TODO weird to have n subscribes inside ngFors
        this.listRootNode = response as ListNodeV2;

        this._lookForNode(response as ListNodeV2);
        this._cd.detectChanges();
      });
    }
  }

  private _lookForNode(response: ListNodeV2) {
    if (response.id === this.control.value) {
      this.selectedNode(response);
      return;
    }

    for (const child of response.children) {
      this._lookForNode(child);
      if (this.mySelectedNode) return;
    }
  }
}
