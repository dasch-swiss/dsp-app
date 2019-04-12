import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KuiActionModule } from '@knora/action';
import { KuiAuthenticationModule } from '@knora/authentication';
import { KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppInitService } from './app-init.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoremIpsumComponent } from './dev/lorem-ipsum/lorem-ipsum.component';
import { ConfirmDialogComponent } from './main/dialog/confirm-dialog/confirm-dialog.component';

import { ErrorComponent } from './main/error/error.component';
import { HeaderComponent } from './main/header/header.component';
import { LoginComponent } from './main/login/login.component';
import { MainComponent } from './main/main.component';
import { SelectLanguageComponent } from './main/select-language/select-language.component';
import { MaterialModule } from './material-module';
import { BoardComponent } from './project/board/board.component';
import { AddUserComponent } from './project/collaboration/add-user/add-user.component';
import { CollaborationComponent } from './project/collaboration/collaboration.component';
import { UserListComponent } from './project/collaboration/user-list/user-list.component';
import { OntologyListComponent } from './project/ontology-list/ontology-list.component';
import { OntologyComponent } from './project/ontology/ontology.component';
import { PropertyItemComponent } from './project/ontology/property-item/property-item.component';
import { PropertyListComponent } from './project/ontology/property-list/property-list.component';
import { ResourceItemComponent } from './project/ontology/resource-item/resource-item.component';
import { ResourceListComponent } from './project/ontology/resource-list/resource-list.component';
import { SelectItemComponent } from './project/ontology/select-item/select-item.component';
import { SelectListComponent } from './project/ontology/select-list/select-list.component';
import { ProjectFormComponent } from './project/project-form/project-form.component';
import { ProjectComponent } from './project/project.component';
import { AccountComponent } from './user/account/account.component';
import { CollectionListComponent } from './user/collection-list/collection-list.component';
import { CreateMenuComponent } from './user/create-menu/create-menu.component';
import { ProfileComponent } from './user/profile/profile.component';
import { ProjectsComponent } from './system/projects/projects.component';
import { ProjectsListComponent } from './system/projects/projects-list/projects-list.component';
import { UserFormComponent } from './user/user-form/user-form.component';
import { UserPasswordComponent } from './user/user-form/user-password/user-password.component';
import { UserMenuComponent } from './user/user-menu/user-menu.component';
import { UserComponent } from './user/user.component';
import { SelectGroupComponent } from './project/collaboration/select-group/select-group.component';

import { ResourceTypeComponent } from './project/ontology/resource-type/resource-type.component';
import { WorkspaceComponent } from './workspace/workspace.component';
import { DesignQuestionComponent } from './dev/design-question/design-question.component';
import { DashboardComponent } from './user/dashboard/dashboard.component';
import { ProjectMenuComponent } from './project/project-menu/project-menu.component';
import { MaterialDialogComponent } from './main/dialog/material-dialog/material-dialog.component';
import { SystemComponent } from './system/system.component';
import { UsersComponent } from './system/users/users.component';
import { StatusComponent } from './system/status/status.component';
import { UsersListComponent } from './system/users/users-list/users-list.component';

// Translate: AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient, 'assets/i18n/', '.json');
}

export function initializeApp(appInitService: AppInitService) {
    return (): Promise<any> => {
        return appInitService.Init();
    };
}

@NgModule({
    declarations: [
        AppComponent,
        ProjectComponent,
        BoardComponent,
        ProjectFormComponent,
        CollaborationComponent,
        AddUserComponent,
        UserListComponent,
        OntologyListComponent,
        OntologyComponent,
        PropertyListComponent,
        PropertyItemComponent,
        ResourceListComponent,
        ResourceItemComponent,
        SelectListComponent,
        SelectItemComponent,
        UserComponent,
        ProfileComponent,
        ProjectsListComponent,
        UserFormComponent,
        UserPasswordComponent,
        CollectionListComponent,
        UserMenuComponent,
        CreateMenuComponent,
        MainComponent,
        HeaderComponent,
        ConfirmDialogComponent,
        ErrorComponent,
        LoginComponent,
        LoremIpsumComponent,
        AccountComponent,
        SelectLanguageComponent,
        ProjectsComponent,
        SelectGroupComponent,
        ResourceTypeComponent,
        WorkspaceComponent,
        DesignQuestionComponent,
        DashboardComponent,
        ProjectMenuComponent,
        MaterialDialogComponent,
        SystemComponent,
        UsersComponent,
        StatusComponent,
        UsersListComponent
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        FlexLayoutModule,
        HttpClientModule,
        KuiActionModule,
        KuiAuthenticationModule,
        KuiCoreModule,
        KuiSearchModule,
        MaterialModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })
    ],
    entryComponents: [
        ConfirmDialogComponent,

        ResourceTypeComponent,
        MaterialDialogComponent
    ],
    providers: [
        AppInitService,
        {
            provide: APP_INITIALIZER,
            useFactory: initializeApp,
            deps: [AppInitService],
            multi: true
        },
        {
            provide: KuiCoreConfigToken,
            useFactory: () => AppInitService.coreConfig
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
