import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { CookiePolicyComponent } from './main/cookie-policy/cookie-policy.component';
import { AuthGuard } from './main/guard/auth.guard';
import { OntologyClassInstanceGuard } from './main/guard/ontology-class-instance.guard';
import { HelpComponent } from './main/help/help.component';
import { StatusComponent } from './main/status/status.component';
import { CollaborationComponent } from './project/collaboration/collaboration.component';
import { CreateProjectFormPageComponent } from './project/create-project-form-page/create-project-form-page.component';
import { DataModelsComponent } from './project/data-models/data-models.component';
import { DescriptionComponent } from './project/description/description.component';
import { EditProjectFormPageComponent } from './project/edit-project-form-page/edit-project-form-page.component';
import { ImageSettingsComponent } from './project/image-settings/image-settings.component';
import { ListComponent } from './project/list/list.component';
import { CreateListInfoPageComponent } from './project/list/reusable-list-info-form/create-list-info-page.component';
import { OntologyFormComponent } from './project/ontology/ontology-form/ontology-form.component';
import { OntologyComponent } from './project/ontology/ontology.component';
import { OntologyClassInstanceComponent } from './project/ontology-classes/ontology-class-instance/ontology-class-instance.component';
import { ProjectComponent } from './project/project.component';
import { SettingsComponent } from './project/settings/settings.component';
import { ProjectsComponent } from './system/projects/projects.component';
import { SystemComponent } from './system/system.component';
import { UsersComponent } from './system/users/users.component';
import { OverviewComponent } from './user/overview/overview.component';
import { UserComponent } from './user/user.component';
import { ResourceComponent } from './workspace/resource/resource.component';
import { ResultsComponent } from './workspace/results/results.component';
import { AdvancedSearchContainerComponent } from './workspace/search/advanced-search/advanced-search-container.component';

const routes: Routes = [
  {
    path: RouteConstants.home,
    component: OverviewComponent,
  },
  {
    path: RouteConstants.help,
    component: HelpComponent,
  },
  {
    path: RouteConstants.createNewProjectRelative,
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
        path: RouteConstants.addOntology,
        component: OntologyFormComponent,
        canActivate: [AuthGuard],
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
        path: RouteConstants.OntologyClassInstanceRelative,
        component: OntologyClassInstanceComponent,
      },
      {
        path: RouteConstants.addList,
        component: CreateListInfoPageComponent,
        canActivate: [AuthGuard],
      },
      {
        path: `${RouteConstants.list}/:${RouteConstants.listParameter}`,
        component: ListComponent,
        canActivate: [AuthGuard],
      },
      {
        path: RouteConstants.settings,
        component: SettingsComponent,
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
    path: RouteConstants.resource,
    children: [
      {
        path: RouteConstants.projectResourceValueRelative,
        component: ResourceComponent,
      },
      {
        path: RouteConstants.projectResourceRelative,
        component: ResourceComponent,
      },
    ],
    runGuardsAndResolvers: 'always',
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
