import { AsyncPipe, NgStyle } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  KnoraApiConnection,
  ListNodeV2WithAllLanguages,
  ReadListValue,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { filterUndefined } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { combineLatest, map, Observable, Subject, switchMap } from 'rxjs';
import { ResourceFetcherService } from '../../../../representation/resource-fetcher.service';

@Component({
  selector: 'app-list-viewer',
  imports: [AsyncPipe, NgStyle, MatIconModule, MatTooltipModule, StringifyStringLiteralPipe],
  template: `
    <div
      data-cy="list-switch"
      style="display: flex;
    align-items: center;">
      @for (node of nodes$ | async; track node.id; let last = $last; let index = $index) {
        @let comment = node.comments | appStringifyStringLiteral;
        <span
          [ngStyle]="{ 'font-weight': last && index > 0 ? 'bold' : 'normal' }"
          [matTooltip]="comment"
          [matTooltipDisabled]="!comment"
          >{{ node.labels | appStringifyStringLiteral }}</span
        >
        @if (!last) {
          <mat-icon>chevron_right</mat-icon>
        }
      }
      @if (false && linkToSearchList) {
        <a [href]="linkToSearchList" target="_blank">
          <!-- TODO : enable this feature when the State Management is removed -->
          <mat-icon style="font-size: 16px; height: 14px; margin-left: 4px">open_in_new</mat-icon>
        </a>
      }
    </div>
  `,
})
export class ListViewerComponent implements OnInit {
  @Input() value!: ReadListValue;
  @Input() propertyDef!: ResourcePropertyDefinition;
  nodes$!: Observable<ListNodeV2WithAllLanguages[]>;

  linkToSearchList?: string;
  private _nodeIdSubject = new Subject<string>();

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _resourceFetcher: ResourceFetcherService,
    private _localizationService: LocalizationService
  ) {}

  ngOnInit() {
    this._fetchSearchLink();

    const tree$ = this._dspApiConnection.v2.list.getNodeWithAllLanguages(this.value.listNode).pipe(
      switchMap(v => this._dspApiConnection.v2.list.getListWithAllLanguages(v.hasRootNode!)),
      map(v => {
        const tree = ListViewerComponent.lookFor([v], this.value.listNode) as ListNodeV2WithAllLanguages[];
        this._nodeIdSubject.next(tree[tree.length - 1].id);
        return tree.slice(1);
      })
    );

    // Re-emit on language change so AsyncPipe triggers a change-detection pass
    // and the impure label/comment pipes resolve against the new language.
    this.nodes$ = combineLatest([tree$, this._localizationService.currentLanguage$]).pipe(map(([tree]) => tree));
  }

  private _fetchSearchLink() {
    combineLatest([
      this._resourceFetcher.resource$.pipe(filterUndefined()),
      this._resourceFetcher.projectShortcode$,
      this._nodeIdSubject.asObservable(),
    ]).subscribe(([resource, projectShortcode, nodeId]) => {
      if (!resource) {
        return;
      }
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

  static lookFor(tree: ListNodeV2WithAllLanguages[], id: string): ListNodeV2WithAllLanguages[] | null {
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
