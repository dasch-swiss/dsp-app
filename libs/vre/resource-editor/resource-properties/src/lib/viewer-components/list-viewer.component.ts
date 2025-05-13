import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { KnoraApiConnection, ListNodeV2, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-list-viewer',
  template: `
    <div
      data-cy="list-switch"
      style="display: flex;
    align-items: center;">
      <ng-container *ngFor="let label of labels$ | async; let last = last; let index = index"
        ><span [ngStyle]="{ 'font-weight': last && index > 0 ? 'bold' : 'normal' }">{{ label }}</span>
        <mat-icon *ngIf="!last">chevron_right</mat-icon>
      </ng-container>
      <a *ngIf="linkToSearchList" [href]="linkToSearchList" target="_blank">
        <mat-icon style="font-size: 16px; height: 14px; margin-left: 4px">open_in_new</mat-icon>
      </a>
    </div>
  `,
})
export class ListViewerComponent implements OnInit {
  @Input() control!: FormControl<string>;
  @Input() propertyDef!: ResourcePropertyDefinition;
  labels$!: Observable<string[]>;

  linkToSearchList?: string;
  private _nodeIdSubject = new Subject<string>();

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _resourceFetcher: ResourceFetcherService
  ) {}

  ngOnInit() {
    this._fetchSearchLink();

    if (!this.control.value) {
      return;
    }

    this.labels$ = (this._dspApiConnection.v2.list.getNode(this.control.value) as Observable<ListNodeV2>).pipe(
      switchMap(v => this._dspApiConnection.v2.list.getList(v.hasRootNode!)),
      map(v => {
        const tree = ListViewerComponent.lookFor([v as ListNodeV2], this.control.value) as ListNodeV2[];
        const nodeId = tree[tree.length - 1].id;
        this._nodeIdSubject.next(nodeId);
        return tree.slice(1).map(node => node.label);
      })
    );
  }

  private _fetchSearchLink() {
    combineLatest([
      this._resourceFetcher.resource$,
      this._resourceFetcher.projectShortcode$,
      this._nodeIdSubject.asObservable(),
    ]).subscribe(([resource, projectShortcode, nodeId]) => {
      const searchClassesQuery = `
   PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {
?mainRes knora-api:isMainResource true .
?mainRes <${this.propertyDef.id}> ?prop0 .
} WHERE {
?mainRes a knora-api:Resource .
?mainRes a <${resource.res.type}> .
?mainRes <${this.propertyDef.id}> ?prop0 .
?prop0 <http://api.knora.org/ontology/knora-api/v2#listValueAsListNode> <${nodeId}> .
}
OFFSET 0`;

      this.linkToSearchList = `/project/${projectShortcode}/advanced-search/gravsearch/${encodeURIComponent(searchClassesQuery)}`;
    });
  }

  static lookFor(tree: ListNodeV2[], id: string): ListNodeV2[] | null {
    const node = tree[tree.length - 1];
    if (node.id === id) {
      return tree;
    }
    for (const childNode of node.children) {
      const found = ListViewerComponent.lookFor([...tree, childNode], id);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
}
