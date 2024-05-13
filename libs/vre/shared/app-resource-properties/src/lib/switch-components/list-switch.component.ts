import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { KnoraApiConnection, ListNodeV2, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-list-switch',
  template: `
    <ng-container *ngIf="displayMode; else editMode">
      <span
        style="display: flex;
    align-items: center;">
        <ng-container *ngFor="let label of labels$ | async; let last = last; let index = index"
          ><span [ngStyle]="{ 'font-weight': last && index > 0 ? 'bold' : 'normal' }">{{ label }}</span>
          <mat-icon *ngIf="!last">chevron_right</mat-icon>
        </ng-container>
      </span>
    </ng-container>
    <ng-template #editMode>
      <app-list-value [control]="control" [propertyDef]="propertyDef"></app-list-value>
    </ng-template>
  `,
})
export class ListSwitchComponent implements IsSwitchComponent, OnInit {
  @Input() control!: FormControl<string>;
  @Input() displayMode = true;
  @Input() propertyDef!: ResourcePropertyDefinition;

  labels$!: Observable<string[]>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {}

  ngOnInit() {
    this.labels$ = (this._dspApiConnection.v2.list.getNode(this.control.value) as Observable<ListNodeV2>).pipe(
      switchMap(v => this._dspApiConnection.v2.list.getList(v.hasRootNode!)),
      map(v => {
        const tree = ListSwitchComponent.lookFor([v as ListNodeV2], this.control.value);
        return (tree as ListNodeV2[]).slice(1).map(node => node.label);
      })
    );
  }

  static lookFor(tree: ListNodeV2[], id: string): ListNodeV2[] | null {
    const node = tree[tree.length - 1];
    if (node.id === id) {
      return tree;
    }
    for (const childNode of node.children) {
      const found = ListSwitchComponent.lookFor([...tree, childNode], id);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
}
