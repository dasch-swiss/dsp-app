import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@knora/authentication';
import { DialogComponent } from './main/dialog/dialog.component';
import { FullframeDialogComponent } from './main/dialog/fullframe-dialog/fullframe-dialog.component';
import { ErrorComponent } from './main/error/error.component';
import { LoginComponent } from './main/login/login.component';
import { MainComponent } from './main/main.component';
import { BoardComponent } from './project/board/board.component';
import { CollaborationComponent } from './project/collaboration/collaboration.component';
import { OntologyListComponent } from './project/ontology-list/ontology-list.component';
import { OntologyComponent } from './project/ontology/ontology.component';
import { ProjectFormComponent } from './project/project-form/project-form.component';
import { ProjectComponent } from './project/project.component';
import { ProfileComponent } from './user/profile/profile.component';
import { UserFormComponent } from './user/user-form/user-form.component';
import { UserComponent } from './user/user.component';
import { DashboardComponent } from './user/dashboard/dashboard.component';

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
        path: 'project/new',
        component: FullframeDialogComponent,
        canActivate: [AuthGuard],
        data: {component: ProjectFormComponent}
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
                path: 'edit',
                component: ProjectFormComponent
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
                data: {status: 404}
            }
        ]
    },
    {
        path: 'user/new',
        component: FullframeDialogComponent,
        canActivate: [AuthGuard],
        data: {component: UserFormComponent}
    },
    {
        path: 'user/:name',
        component: ProfileComponent,
    },
    {
        path: 'user/:name/edit',
        component: FullframeDialogComponent,
        canActivate: [AuthGuard],
        data: {component: UserFormComponent}
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
        path: '**',
        component: ErrorComponent,
        data: {status: 404}
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
