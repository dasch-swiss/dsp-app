import { AfterViewChecked, ChangeDetectorRef, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchParams } from './list-view/list-view.component';

export interface SplitSize {
  gutterNum: number;
  sizes: Array<number>;
}

@Component({
  selector: 'app-results',
  template: ' <app-multiple-viewer [searchParams]="searchParams" />',
})
export class ResultsComponent implements AfterViewChecked {
  searchParams: SearchParams;
  resourceIri: string;
  projectUuid: string;

  constructor(
    private _route: ActivatedRoute,
    private _titleService: Title,
    private _cd: ChangeDetectorRef
  ) {
    const parentParams$ = this._route.parent.paramMap;
    const params$ = this._route.paramMap;

    const combinedParams$ = combineLatest([parentParams$, params$]).pipe(
      map(([parentParams, params]) => ({
        parentParams,
        params,
      }))
    );

    combinedParams$.subscribe(data => {
      const parentParams = data.parentParams;
      const params = data.params;

      this._handleParentParams(parentParams);
      this._handleSearchParams(params);

      this._titleService.setTitle(`Search results for ${this.searchParams.mode} search`);
    });
  }

  ngAfterViewChecked() {
    this._cd.detectChanges();
  }

  private _handleParentParams(parentParams: Params) {
    this.projectUuid = parentParams.get('uuid');
  }

  private _handleSearchParams(params: Params) {
    const searchQuery = decodeURIComponent(params.get('q'));
    const searchMode = decodeURIComponent(params.get('mode')) === 'fulltext' ? 'fulltext' : 'gravsearch';

    this.searchParams = {
      query: searchQuery,
      mode: searchMode,
    };

    if (this.projectUuid) {
      this.searchParams.projectUuid = this.projectUuid;
    }

    if (params.get('project') && searchMode === 'fulltext') {
      this.searchParams.filter = {
        limitToProject: decodeURIComponent(params.get('project')),
      };
    }
  }
}
