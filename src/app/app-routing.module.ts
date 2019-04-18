import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@knora/authentication';

import { ErrorComponent } from './main/error/error.component';
import { LoginComponent } from './main/login/login.component';
import { MainComponent } from './main/main.component';
// project
import { BoardComponent } from './project/board/board.component';
import { CollaborationComponent } from './project/collaboration/collaboration.component';
import { OntologyComponent } from './project/ontology/ontology.component';
import { ProjectComponent } from './project/project.component';
// user
import { ProfileComponent } from './user/profile/profile.component';
import { UserComponent } from './user/user.component';
import { DashboardComponent } from './user/dashboard/dashboard.component';

// workspace
import { WorkspaceComponent } from './workspace/workspace.component';
import { AdvancedSearchComponent } from './workspace/search/advanced-search/advanced-search.component';
import { ExpertSearchComponent } from './workspace/search/expert-search/expert-search.component';
import { ResultsComponent } from './workspace/results/results.component';

import { DesignQuestionComponent } from './dev/design-question/design-question.component';
import { SystemComponent } from './system/system.component';
import { ProjectsComponent } from './system/projects/projects.component';
import { UsersComponent } from './system/users/users.component';
import { StatusComponent } from './system/status/status.component';
import { ResourceComponent } from './workspace/resource/resource.component';

const routes: Routes = [
    {
        path: '',
        component: MainComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'project/:shortcode',
        component: ProjectComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'board'
            },
            {
                path: 'board',
                component: BoardComponent
            },
            {
                path: 'collaboration',
                component: CollaborationComponent
            },
            {
                path: 'ontologies',
                component: OntologyComponent
            },
            {
                path: 'ontology/:id',
                component: OntologyComponent,
            },
            {
                path: '**',
                component: ErrorComponent,
                data: { status: 404 }
            }
        ]
    },
    {
        path: 'user/:name',
        component: ProfileComponent,
    },
    {
        path: 'profile',
        component: UserComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'account',
        component: UserComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'projects',
        component: UserComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'collections',
        component: UserComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'system',
        component: SystemComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'projects'
            },
            {
                path: 'projects',
                component: ProjectsComponent
            },
            {
                path: 'users',
                component: UsersComponent
            },
            {
                path: 'status',
                component: StatusComponent
            },
        ]
    },
    {
        path: 'search',
        // component: WorkspaceComponent,
        children: [
            {
                path: 'advanced',
                component: AdvancedSearchComponent
            },
            {
                path: 'expert',
                component: ExpertSearchComponent
            },
            {
                path: ':mode/:q',
                component: ResultsComponent
            },
            {
                path: ':mode/:q/:project',
                component: ResultsComponent
            }
        ]
    },
    {
      path: 'resource/:id',
      component: ResourceComponent,
      runGuardsAndResolvers: 'always'
    },
    {
        path: 'dev',        // developer test environment
        component: DesignQuestionComponent
    },
    {
        path: '**',
        component: ErrorComponent,
        data: { status: 404 }
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
