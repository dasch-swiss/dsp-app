import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { CenteredLayoutComponent } from '@dasch-swiss/vre/ui/ui';
import { AdvancedSearchComponent } from './advanced-search.component';

@Component({
  selector: 'app-advanced-search-page',
  template: `
    <app-centered-layout>
      <app-advanced-search
        [projectUuid]="uuid"
        [isVerticalDirection]="undefined"
        [queryToLoad]="queryToLoad"
        (gravsearchQuery)="onSearch($event)" />
    </app-centered-layout>
  `,
  imports: [CenteredLayoutComponent, AdvancedSearchComponent],
})
export class AdvancedSearchPageComponent implements OnInit {
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _projectPageService = inject(ProjectPageService);

  queryToLoad: string | undefined;

  get uuid(): string {
    return this._projectPageService.currentProjectUuid;
  }

  ngOnInit(): void {
    this.queryToLoad = this._route.snapshot.queryParamMap.get('q') ?? undefined;
  }

  onSearch(query: string): void {
    this._router.navigate(['results'], {
      relativeTo: this._route,
      queryParams: { q: query },
    });
  }
}
