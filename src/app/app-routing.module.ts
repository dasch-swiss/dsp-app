import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@knora/authentication';
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
import { SearchComponent } from './search/search.component';
import { ExtendedSearchComponent } from './search/extended-search/extended-search.component';
import { FacetedSearchComponent } from './search/faceted-search/faceted-search.component';
import { GravsearchComponent } from './search/gravsearch/gravsearch.component';
import { FulltextSearchComponent } from './search/fulltext-search/fulltext-search.component';

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
        path: 'project/new',
        component: ProjectFormComponent,
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
                path: 'edit',
                component: ProjectFormComponent
            },
            {
                path: 'collaboration',
                component: CollaborationComponent
            },
            {
                path: 'ontologies',
                component: OntologyListComponent
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
        path: 'search',
        component: SearchComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'fulltext'
            },
            {
                path: 'fulltext',
                component: FulltextSearchComponent
            },
            {
                path: 'extended',
                component: ExtendedSearchComponent
            },
            {
                path: 'faceted',
                component: FacetedSearchComponent
            },
            {
                path: 'gravsearch',
                component: GravsearchComponent
            }
        ]
    },
    {
        path: 'user/new',
        component: UserFormComponent,
        canActivate: [AuthGuard]
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
        path: '**',
        component: ErrorComponent,
        data: { status: 404 }
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
