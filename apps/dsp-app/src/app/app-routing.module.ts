import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { CreateListInfoPageComponent, ListPageComponent } from '@dasch-swiss/vre/pages/ontology/list';
import { DataModelsComponent, OntologyComponent } from '@dasch-swiss/vre/pages/ontology/ontology';
import { OntologyClassInstanceComponent } from '@dasch-swiss/vre/pages/ontology/ontology-classes';
import {
  CollaborationComponent,
  CreateProjectFormPageComponent,
  DescriptionComponent,
  EditProjectFormPageComponent,
  ImageSettingsComponent,
  LegalSettingsComponent,
  ProjectComponent,
  SettingsPageComponent,
} from '@dasch-swiss/vre/pages/project/project';
import { AdvancedSearchContainerComponent, ResultsComponent } from '@dasch-swiss/vre/pages/search/search';
import {
  CookiePolicyComponent,
  ProjectsComponent,
  SystemComponent,
  UsersComponent,
} from '@dasch-swiss/vre/pages/system/system';
import { ProjectOverviewComponent, UserComponent } from '@dasch-swiss/vre/pages/user-settings/user';
import { ResourcePageComponent, SingleResourcePageComponent } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { CreateResourcePageComponent } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { StatusComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { HelpPageComponent } from '@dasch-swiss/vre/shared/app-help-page';
import { AuthGuard } from './main/guard/auth.guard';
import { OntologyClassInstanceGuard } from './main/guard/ontology-class-instance.guard';

const routes: Routes = [
  {
    path: RouteConstants.home,
    component: ProjectOverviewComponent,
  },
  {
    path: RouteConstants.help,
    component: HelpPageComponent,
  },
  {
    path: `${RouteConstants.createNewProjectRelative}`,
    canActivate: [AuthGuard],
    component: CreateProjectFormPageComponent,
  },
  {
    path: RouteConstants.projectUuidRelative,
    component: ProjectComponent,
    children: [
      {
        path: RouteConstants.home,
        component: DescriptionComponent,
      },
      {
        path: RouteConstants.dataModels,
        component: DataModelsComponent,
      },
      {
        path: RouteConstants.ontologyRelative,
        component: OntologyComponent,
        canActivate: [AuthGuard],
      },
      {
        path: RouteConstants.OntologyEditorViewRelative,
        component: OntologyComponent,
        canActivate: [AuthGuard],
      },
      {
        canActivate: [OntologyClassInstanceGuard],
        path: RouteConstants.OntologyClassRelative,
        component: OntologyClassInstanceComponent,
      },
      {
        canActivate: [OntologyClassInstanceGuard],
        path: RouteConstants.OntologyClassAddRelative,
        component: CreateResourcePageComponent,
      },
      {
        path: RouteConstants.JulienOntologyClassRelative,
        component: ResourcePageComponent,
      },
      {
        path: RouteConstants.addList,
        component: CreateListInfoPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: `${RouteConstants.list}/:${RouteConstants.listParameter}`,
        component: ListPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: RouteConstants.settings,
        component: SettingsPageComponent,
        canActivate: [AuthGuard],
        children: [
          {
            path: RouteConstants.home,
            pathMatch: 'full',
            redirectTo: RouteConstants.edit,
          },
          {
            path: RouteConstants.edit,
            component: EditProjectFormPageComponent,
          },
          {
            path: RouteConstants.imageSettings,
            component: ImageSettingsComponent,
          },
          {
            path: RouteConstants.legalSettings,
            component: LegalSettingsComponent,
          },
          {
            path: RouteConstants.collaboration,
            component: CollaborationComponent,
          },
        ],
      },
      {
        path: RouteConstants.advancedSearch,
        component: AdvancedSearchContainerComponent,
      },
      {
        path: RouteConstants.advancedSearchResultsRelative,
        component: ResultsComponent,
      },
      {
        path: RouteConstants.notFoundWildcard,
        component: StatusComponent,
        data: { status: RouteConstants.notFound },
      },
    ],
  },
  {
    path: RouteConstants.userAccount,
    component: UserComponent,
    canActivate: [AuthGuard],
  },
  {
    path: RouteConstants.projects,
    component: UserComponent,
    canActivate: [AuthGuard],
  },
  {
    path: RouteConstants.system,
    component: SystemComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: RouteConstants.systemProjects,
        pathMatch: 'full',
      },
      {
        path: RouteConstants.systemProjects,
        component: ProjectsComponent,
      },
      {
        path: RouteConstants.systemUsers,
        component: UsersComponent,
      },
    ],
  },
  {
    path: RouteConstants.search,
    children: [
      {
        path: RouteConstants.searchProjectRelative,
        component: ResultsComponent,
      },
      {
        path: RouteConstants.searchRelative,
        component: ResultsComponent,
      },
    ],
  },
  {
    path: RouteConstants.projectResourceRelative,
    component: SingleResourcePageComponent,
  },
  {
    path: RouteConstants.cookiePolicy,
    component: CookiePolicyComponent,
  },
  {
    path: RouteConstants.notFoundWildcard,
    component: StatusComponent,
    data: { status: RouteConstants.notFound },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      bindToComponentInputs: true,
      onSameUrlNavigation: 'reload',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
