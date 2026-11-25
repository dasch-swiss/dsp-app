import { inject } from '@angular/core';
import { CanActivateFn, Params, Router, Routes } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ListPageComponent } from '@dasch-swiss/vre/pages/ontology/list';
import { DataModelEditorService } from '@dasch-swiss/vre/pages/ontology/ontology';
import {
  DATA_MODEL_EDITOR,
  CollaborationPageComponent,
  CreateProjectFormPageComponent,
  DataBrowserPageComponent,
  DataClassViewComponent,
  DataOverviewComponent,
  EditProjectFormPageComponent,
  ImageSettingsComponent,
  LegalSettingsComponent,
  OntologyMapPageComponent,
  DataModelClassesComponent,
  DataModelPropertiesComponent,
  DataModelListsComponent,
  DataModelsTreePageComponent,
  ProjectAdminGuard,
  ProjectPageComponent,
  ProjectPageGuard,
  ResourceMetadataComponent,
  SettingsPageComponent,
  ViewRestrictionsComponent,
} from '@dasch-swiss/vre/pages/project/project';
import { AdvancedSearchPageComponent } from '@dasch-swiss/vre/pages/search/advanced-search';
import { FulltextSearchResultsPageComponent, GlobalPageComponent } from '@dasch-swiss/vre/pages/search/search';
import {
  CookiePolicyComponent,
  ProjectsComponent,
  SystemPageComponent,
  UsersTabComponent,
} from '@dasch-swiss/vre/pages/system/system';
import { AccountComponent, ProjectOverviewComponent, UserComponent } from '@dasch-swiss/vre/pages/user-settings/user';
import { SingleResourcePageComponent } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { HelpPageComponent } from '@dasch-swiss/vre/shared/app-help-page';
import { NoResultsFoundComponent, NoResultsFoundPageComponent, NotAllowedPageComponent } from '@dasch-swiss/vre/ui/ui';
import { AuthGuard } from './main/guard/auth.guard';
import { SysAdminGuard } from './main/guard/sys-admin.guard';

/**
 * Sends a former editor link to the project's Data models page, at its section, showing the data model the link
 * named. A guard, not a redirect: a redirect neither sees the project in a parent route nor keeps a query.
 */
const toDataModels: CanActivateFn = route => {
  const params = Object.assign({}, ...route.pathFromRoot.map(step => step.params)) as Params;
  const section = params['section'] ? [params['section']] : [];
  return inject(Router).createUrlTree(
    [RouteConstants.project, params[RouteConstants.uuidParameter], RouteConstants.dataModels, ...section],
    { queryParams: { [RouteConstants.ontologyParameter]: params[RouteConstants.ontoParameter] } }
  );
};

export const routes: Routes = [
  {
    path: RouteConstants.projectUuidRelative,
    component: ProjectPageComponent,
    canActivate: [ProjectPageGuard],
    // Editing a class or a property from the Data and Data models 2 tabs opens the data model editor's dialog in place.
    providers: [{ provide: DATA_MODEL_EDITOR, useClass: DataModelEditorService }],
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
      // The data models: a rail listing every data model, each folding open on its sections.
      {
        path: RouteConstants.dataModels,
        component: DataModelsTreePageComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: RouteConstants.classes },
          { path: RouteConstants.graph, component: OntologyMapPageComponent },
          { path: RouteConstants.classes, component: DataModelClassesComponent },
          { path: RouteConstants.properties, component: DataModelPropertiesComponent },
          { path: RouteConstants.lists, component: DataModelListsComponent },
          { path: `${RouteConstants.list}/:${RouteConstants.listParameter}`, component: ListPageComponent },
        ],
      },
      // The former editor's links name their data model in the path: it moves to the query, so the same one opens.
      { path: `${RouteConstants.ontologyEditorRelative}/:section`, canActivate: [toDataModels], children: [] },
      { path: RouteConstants.ontologyEditorRelative, canActivate: [toDataModels], children: [] },
      {
        path: `${RouteConstants.list}/:${RouteConstants.listParameter}`,
        redirectTo: `${RouteConstants.dataModels}/${RouteConstants.list}/:${RouteConstants.listParameter}`,
      },
      {
        path: RouteConstants.settings,
        component: SettingsPageComponent,
        canActivate: [ProjectAdminGuard],
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
          {
            path: RouteConstants.viewRestrictions,
            component: ViewRestrictionsComponent,
          },
        ],
      },
      {
        path: RouteConstants.search,
        redirectTo: RouteConstants.advancedSearch,
        pathMatch: 'full',
      },
      {
        path: RouteConstants.advancedSearch,
        component: AdvancedSearchPageComponent,
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
          { path: RouteConstants.projects, component: ProjectsComponent, data: { isUsersProjects: true } },
        ],
        canActivate: [AuthGuard],
      },
      {
        path: RouteConstants.system,
        component: SystemPageComponent,
        canActivate: [SysAdminGuard],
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
        path: RouteConstants.notAllowed,
        component: NotAllowedPageComponent,
      },
      {
        path: RouteConstants.notFound,
        component: NoResultsFoundPageComponent,
      },
      // Wildcard route - must be last. Catches all unmatched routes
      {
        path: RouteConstants.notFoundWildcard,
        redirectTo: RouteConstants.notFound,
      },
    ],
  },
];
