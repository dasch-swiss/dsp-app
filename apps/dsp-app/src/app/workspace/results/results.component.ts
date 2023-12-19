import { AfterViewChecked, ChangeDetectorRef, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FilteredResources, SearchParams } from './list-view/list-view.component';

export interface SplitSize {
  gutterNum: number;
  sizes: Array<number>;
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent implements AfterViewChecked {
  searchParams: SearchParams;

  resIri: string;

  resourceIri: string;

  // display single resource or intermediate page in case of multiple selection
  viewMode: 'single' | 'intermediate' | 'compare' = 'single';

  // which resources are selected?
  selectedResources: FilteredResources;

  // search params
  searchQuery: string;
  searchMode: 'fulltext' | 'gravsearch';

  loading = true;

  splitSize: SplitSize;

  projectUuid: string;

  constructor(
    private _route: ActivatedRoute,
    private _titleService: Title,
    private _cd: ChangeDetectorRef
  ) {
    const parentParams$ = this._route.parent.paramMap;
    const params$ = this._route.paramMap;

    const combinedParams$ = combineLatest([parentParams$, params$]).pipe(
      map(([parentParams, params]) => {
        return {
          parentParams: parentParams,
          params: params,
        };
      })
    );

    combinedParams$.subscribe(data => {
      const parentParams = data.parentParams;
      const params = data.params;

      this._handleParentParams(parentParams);
      this._handleSearchParams(params);

      this._titleService.setTitle('Search results for ' + this.searchParams.mode + ' search');
    });
  }

  ngAfterViewChecked() {
    this._cd.detectChanges();
  }

  onSelectionChange(res: FilteredResources) {
    this.selectedResources = res;
    this.resourceIri = this.selectedResources.resInfo[0]?.id;

    if (!res || res.count <= 1) {
      this.viewMode = 'single';
    } else {
      if (this.viewMode !== 'compare') {
        this.viewMode = res && res.count > 0 ? 'intermediate' : 'single';
      }
    }
  }

  private _handleParentParams(parentParams: Params) {
    this.projectUuid = parentParams.get('uuid');
  }

  private _handleSearchParams(params: Params) {
    this.searchQuery = decodeURIComponent(params.get('q'));
    this.searchMode = decodeURIComponent(params.get('mode')) === 'fulltext' ? 'fulltext' : 'gravsearch';

    this.searchParams = {
      query: this.searchQuery,
      mode: this.searchMode,
    };

    if (this.projectUuid) {
      this.searchParams.projectUuid = this.projectUuid;
    }

    if (params.get('project') && this.searchMode === 'fulltext') {
      this.searchParams.filter = {
        limitToProject: decodeURIComponent(params.get('project')),
      };
    }
  }
}
