import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ListPageComponent } from '@dasch-swiss/vre/pages/ontology/list';
import {
  DataModelsPageComponent,
  OntologyEditorPageComponent,
  OntologyPageComponent,
  OntologyPropertiesComponent,
} from '@dasch-swiss/vre/pages/ontology/ontology';
import {
  CollaborationPageComponent,
  CreateProjectFormPageComponent,
  DataBrowserPageComponent,
  DataClassViewComponent,
  DataOverviewComponent,
  EditProjectFormPageComponent,
  ImageSettingsComponent,
  LegalSettingsComponent,
  ProjectPageComponent,
  ProjectPageGuard,
  ResourceMetadataComponent,
  SettingsPageComponent,
} from '@dasch-swiss/vre/pages/project/project';
import {
  AdvancedSearchPageComponent,
  AdvancedSearchResultsPageComponent,
  FulltextSearchResultsPageComponent,
  GlobalPageComponent,
  ProjectFulltextSearchPageComponent,
} from '@dasch-swiss/vre/pages/search/search';
import {
  CookiePolicyComponent,
  ProjectsComponent,
  SystemPageComponent,
  UsersTabComponent,
} from '@dasch-swiss/vre/pages/system/system';
import { AccountComponent, ProjectOverviewComponent, UserComponent } from '@dasch-swiss/vre/pages/user-settings/user';
import { SingleResourcePageComponent } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { StatusComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { HelpPageComponent } from '@dasch-swiss/vre/shared/app-help-page';
import { AuthGuard } from './main/guard/auth.guard';

const routes: Routes = [
  {
    path: RouteConstants.projectUuidRelative,
    component: ProjectPageComponent,
    canActivate: [ProjectPageGuard],
    children: [
      {
        path: RouteConstants.home,
        pathMatch: 'full',
        redirectTo: RouteConstants.data,
      },
      {
        path: RouteConstants.data,
        component: DataBrowserPageComponent,
        children: [
          { path: '', component: DataOverviewComponent },
          {
            path: `:${RouteConstants.ontologyParameter}/:${RouteConstants.classParameter}`,
            component: DataClassViewComponent,
          },
        ],
      },
      {
        path: RouteConstants.dataModels,
        component: DataModelsPageComponent,
      },
      {
        path: RouteConstants.ontologyEditorRelative,
        component: OntologyPageComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: RouteConstants.classes,
          },
          {
            path: RouteConstants.classes,
            component: OntologyEditorPageComponent,
          },
          {
            path: RouteConstants.properties,
            component: OntologyPropertiesComponent,
          },
        ],
      },
      {
        path: `${RouteConstants.list}/:${RouteConstants.listParameter}`,
        component: ListPageComponent,
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
            path: RouteConstants.resourceMetadata,
            component: ResourceMetadataComponent,
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
            component: CollaborationPageComponent,
          },
        ],
      },
      {
        path: RouteConstants.search,
        component: ProjectFulltextSearchPageComponent,
      },
      {
        path: RouteConstants.advancedSearchResultsRelative,
        component: AdvancedSearchResultsPageComponent,
      },
      { path: RouteConstants.advancedSearch, component: AdvancedSearchPageComponent },
      {
        path: RouteConstants.notFoundWildcard,
        component: StatusComponent,
        data: { status: RouteConstants.notFound },
      },
    ],
  },
  {
    path: '',
    component: GlobalPageComponent,
    children: [
      {
        path: RouteConstants.home,
        component: ProjectOverviewComponent,
      },
      { path: RouteConstants.searchRelative, component: FulltextSearchResultsPageComponent },
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
        path: RouteConstants.myProfile,
        component: UserComponent,
        children: [
          { path: RouteConstants.userAccount, component: AccountComponent },
          { path: RouteConstants.projects, component: ProjectsComponent },
        ],
        canActivate: [AuthGuard],
      },
      {
        path: RouteConstants.projects,
        component: UserComponent,
        canActivate: [AuthGuard],
      },
      {
        path: RouteConstants.system,
        component: SystemPageComponent,
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
            component: UsersTabComponent,
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
        path: RouteConstants.notFound,
        component: StatusComponent,
        data: { status: RouteConstants.notFound },
      },
      {
        path: RouteConstants.notFoundWildcard,
        component: StatusComponent,
        data: { status: RouteConstants.notFound },
      },
    ],
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
