import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectPageService } from './project-page.service';

@Component({
  selector: 'app-project-navigation-tabs',
  template: `
    <nav
      mat-tab-nav-bar
      [tabPanel]="tabPanel"
      mat-stretch-tabs="false"
      mat-align-tabs="start"
      animationDuration="0"
      style="background-color: inherit; padding-left: 16px">
      <a mat-tab-link [routerLink]="[DATA]" (click)="reloadPage($event)" [class.active-link]="isDataRouteActive()">
        <mat-icon class="tab-icon">list</mat-icon>
        {{ 'shared.header.projectTabs.data' | translate }}
      </a>
      <a mat-tab-link [routerLink]="[SEARCH]" [class.active-link]="isSearchRouteActive()">
        <mat-icon class="tab-icon">search</mat-icon>
        {{ 'ui.common.actions.search' | translate }}
      </a>
      <a mat-tab-link [routerLink]="[DATA_MODELS]" [class.active-link]="isDataModelsRouteActive()">
        <mat-icon class="tab-icon">lan</mat-icon>
        {{ 'shared.header.projectTabs.dataModels' | translate }}
      </a>
      @if (projectPageService.hasProjectAdminRights$ | async) {
        <a mat-tab-link [routerLink]="[SETTINGS]" routerLinkActive="active-link">
          <mat-icon class="tab-icon">settings</mat-icon>
          {{ 'shared.header.projectTabs.settings' | translate }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>
  `,
  styles: [
    `
      .tab-icon {
        margin-right: 8px;
      }
      .active-link {
        border-bottom: 2px solid #336790;
        font-weight: 500;
      }

      :host ::ng-deep .mat-mdc-tab-link {
        padding-left: 16px;
        padding-right: 16px;
      }
    `,
  ],
  standalone: true,
  imports: [AsyncPipe, MatTabNav, MatTabLink, MatTabNavPanel, MatIcon, RouterLink, RouterLinkActive, TranslateModule],
})
export class ProjectNavigationTabsComponent {
  readonly DATA = RouteConstants.data;
  readonly DATA_MODELS = RouteConstants.dataModels;
  readonly SETTINGS = RouteConstants.settings;
  readonly SEARCH = RouteConstants.search;
  readonly DESCRIPTION = RouteConstants.projectDescription;

  get path() {
    return this._route.snapshot.children[0].url[0].path;
  }
  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    public readonly projectPageService: ProjectPageService
  ) {}

  reloadPage(event: MouseEvent) {
    event.preventDefault();
    this._router.navigateByUrl('', { skipLocationChange: true }).then(() => {
      this._router.navigate([RouteConstants.data], { relativeTo: this._route });
    });
  }
  isDataRouteActive(): boolean {
    return this.path === 'data' || this.path.startsWith('/data/');
  }

  isDataModelsRouteActive(): boolean {
    return this.path.startsWith('data-models') || this.path.startsWith('ontology');
  }

  isSearchRouteActive() {
    return this.path.startsWith('search') || this.path.startsWith('advanced-search');
  }
}
