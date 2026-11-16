import { AsyncPipe, NgStyle } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListNodeV2WithAllLanguages, ReadListValue, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { filterUndefined, listRootIriFromGuiAttributes } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { combineLatest, map, Observable, of, Subject, tap } from 'rxjs';
import { ResourceFetcherService } from '../../../../representation/resource-fetcher.service';
import { PropertyValueService } from '../../property-value/property-value.service';

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
    private _propertyValueService: PropertyValueService,
    private _resourceFetcher: ResourceFetcherService,
    private _localizationService: LocalizationService
  ) {}

  ngOnInit() {
    this._fetchSearchLink();

    // Derive the list root from the property definition (already in memory) instead of a
    // /v2/node round trip whose only purpose was to read hasRootNode.
    const rootIri = listRootIriFromGuiAttributes(this.propertyDef.guiAttributes);
    if (!rootIri) {
      this.nodes$ = of([]);
      return;
    }

    // Share one whole-list fetch across all of this property's values (provided per property),
    // so N values from the same list issue a single /v2/lists request, not N.
    const tree$ = this._propertyValueService.getList$(rootIri).pipe(
      map(v => ListViewerComponent.lookFor([v], this.value.listNode) as ListNodeV2WithAllLanguages[]),
      tap(tree => this._nodeIdSubject.next(tree[tree.length - 1].id)),
      map(tree => tree.slice(1))
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
