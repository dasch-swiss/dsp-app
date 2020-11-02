import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import {
    AppInitService,
    DspActionModule,
    DspApiConfigToken,
    DspApiConnectionToken,
    DspCoreModule,
    DspSearchModule,
    DspViewerModule
} from '@dasch-swiss/dsp-ui';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CookiePolicyComponent } from './main/cookie-policy/cookie-policy.component';
import { DialogHeaderComponent } from './main/dialog/dialog-header/dialog-header.component';
import { DialogComponent } from './main/dialog/dialog.component';
import { ErrorComponent } from './main/error/error.component';
import { FooterComponent } from './main/footer/footer.component';
import { GridComponent } from './main/grid/grid.component';
import { HeaderComponent } from './main/header/header.component';
import { HelpComponent } from './main/help/help.component';
import { LoginComponent } from './main/login/login.component';
import { MainComponent } from './main/main.component';
import { SelectLanguageComponent } from './main/select-language/select-language.component';
import { MaterialModule } from './material-module';
import { BoardComponent } from './project/board/board.component';
import { AddUserComponent } from './project/collaboration/add-user/add-user.component';
import { CollaborationComponent } from './project/collaboration/collaboration.component';
import { SelectGroupComponent } from './project/collaboration/select-group/select-group.component';
import { ListInfoFormComponent } from './project/list/list-info-form/list-info-form.component';
import { ListItemFormComponent } from './project/list/list-item-form/list-item-form.component';
import { ListItemComponent } from './project/list/list-item/list-item.component';
import { ListComponent } from './project/list/list.component';
import { OntologyFormComponent } from './project/ontology/ontology-form/ontology-form.component';
import { OntologyComponent } from './project/ontology/ontology.component';
import { OntologyVisualizerComponent } from './project/ontology/ontology-visualizer/ontology-visualizer.component';
import { VisualizerComponent } from './project/ontology/ontology-visualizer/visualizer/visualizer.component';
import { ResourceClassFormComponent } from './project/ontology/resource-class-form/resource-class-form.component';
import { PropertyFormComponent } from './project/ontology/property-form/property-form.component';
import { AddGroupComponent } from './project/permission/add-group/add-group.component';
import { PermissionComponent } from './project/permission/permission.component';
import { ProjectFormComponent } from './project/project-form/project-form.component';
import { ProjectComponent } from './project/project.component';
import { GroupsListComponent } from './system/groups/groups-list/groups-list.component';
import { GroupsComponent } from './system/groups/groups.component';
import { ProjectsListComponent } from './system/projects/projects-list/projects-list.component';
import { ProjectsComponent } from './system/projects/projects.component';
import { StatusComponent } from './system/status/status.component';
import { SystemComponent } from './system/system.component';
import { UsersListComponent } from './system/users/users-list/users-list.component';
import { UsersComponent } from './system/users/users.component';
import { AccountComponent } from './user/account/account.component';
import { CollectionListComponent } from './user/collection-list/collection-list.component';
import { DashboardComponent } from './user/dashboard/dashboard.component';
import { MembershipComponent } from './user/membership/membership.component';
import { ProfileComponent } from './user/profile/profile.component';
import { PasswordFormComponent } from './user/user-form/password-form/password-form.component';
import { UserFormComponent } from './user/user-form/user-form.component';
import { UserMenuComponent } from './user/user-menu/user-menu.component';
import { UserComponent } from './user/user.component';
import { ResourceComponent } from './workspace/resource/resource.component';
import { ResultsComponent } from './workspace/results/results.component';

import { environment } from '../environments/environment';
import { ExternalLinksDirective } from './main/directive/external-links.directive';

// translate: AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient, 'assets/i18n/', '.json')
}

@NgModule({
    declarations: [
        AppComponent,
        ProjectComponent,
        BoardComponent,
        ProjectFormComponent,
        CollaborationComponent,
        AddUserComponent,
        OntologyComponent,
        UserComponent,
        PasswordFormComponent,
        ProfileComponent,
        ProjectsListComponent,
        UserFormComponent,
        CollectionListComponent,
        UserMenuComponent,
        MainComponent,
        HeaderComponent,
        ErrorComponent,
        LoginComponent,
        AccountComponent,
        SelectLanguageComponent,
        ProjectsComponent,
        SelectGroupComponent,
        ResultsComponent,
        ResourceComponent,
        DashboardComponent,
        DialogComponent,
        SystemComponent,
        UsersComponent,
        StatusComponent,
        UsersListComponent,
        DialogHeaderComponent,
        GridComponent,
        CookiePolicyComponent,
        GroupsComponent,
        GroupsListComponent,
        PermissionComponent,
        AddGroupComponent,
        ResourceClassFormComponent,
        PropertyFormComponent,
        OntologyFormComponent,
        OntologyVisualizerComponent,
        VisualizerComponent,
        ListComponent,
        ListInfoFormComponent,
        ListItemComponent,
        ListItemFormComponent,
        MembershipComponent,
        HelpComponent,
        FooterComponent,
        ExternalLinksDirective
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        HttpClientModule,
        DspCoreModule,
        DspViewerModule,
        DspActionModule,
        DspSearchModule,
        MaterialModule,
        ReactiveFormsModule,
        FormsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: (appInitService: AppInitService) =>
                (): Promise<void> => {
                    return appInitService.Init('config', environment);
                },
            deps: [AppInitService],
            multi: true
        },
        {
            provide: DspApiConfigToken,
            useFactory: (appInitService: AppInitService) => appInitService.dspApiConfig,
            deps: [AppInitService]
        },
        {
            provide: DspApiConnectionToken,
            useFactory: (appInitService: AppInitService) => new KnoraApiConnection(appInitService.dspApiConfig),
            deps: [AppInitService]
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
