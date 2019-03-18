import { DragDropModule } from '@angular/cdk/drag-drop';
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
import { DialogComponent } from './main/dialog/dialog.component';
import { ErrorComponent } from './main/error/error.component';
import { HeaderComponent } from './main/header/header.component';
import { LoginComponent } from './main/login/login.component';
import { MainComponent } from './main/main.component';
import { NavigationItemComponent } from './main/navigation/navigation-item/navigation-item.component';
import { NavigationComponent } from './main/navigation/navigation.component';
import { SelectLanguageComponent } from './main/select-language/select-language.component';
import { MaterialModule } from './material-module';
import { BoardComponent } from './project/board/board.component';
import { AddUserComponent } from './project/collaboration/add-user/add-user.component';
import { CollaborationComponent } from './project/collaboration/collaboration.component';
import { UserItemComponent } from './project/collaboration/user-item/user-item.component';
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
import { ProjectsComponent } from './user/projects/projects.component';
import { ProjectListComponent } from './user/projects/project-list/project-list.component';
import { GroupSelectComponent } from './user/user-form/group-select/group-select.component';
import { SelectUserComponent } from './user/user-form/select-user/select-user.component';
import { UserDataComponent } from './user/user-form/user-data/user-data.component';
import { UserFormComponent } from './user/user-form/user-form.component';
import { UserPasswordComponent } from './user/user-form/user-password/user-password.component';
import { UserRoleComponent } from './user/user-form/user-role/user-role.component';
import { UserMenuComponent } from './user/user-menu/user-menu.component';
import { UserComponent } from './user/user.component';
import { SelectGroupComponent } from './project/collaboration/select-group/select-group.component';
import { FullframeDialogComponent } from './main/dialog/fullframe-dialog/fullframe-dialog.component';
import { ResourceTypeComponent } from './project/ontology/resource-type/resource-type.component';
import { WorkspaceComponent } from './workspace/workspace.component';
import { DesignQuestionComponent } from './dev/design-question/design-question.component';


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
        UserItemComponent,
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
        ProjectListComponent,
        UserFormComponent,
        GroupSelectComponent,
        SelectUserComponent,
        UserDataComponent,
        UserPasswordComponent,
        UserRoleComponent,
        CollectionListComponent,
        UserMenuComponent,
        CreateMenuComponent,
        MainComponent,
        HeaderComponent,
        NavigationComponent,
        NavigationItemComponent,
        DialogComponent,
        ConfirmDialogComponent,
        ErrorComponent,
        LoginComponent,
        LoremIpsumComponent,
        AccountComponent,
        SelectLanguageComponent,
        ProjectsComponent,
        SelectGroupComponent,
        FullframeDialogComponent,
        ResourceTypeComponent,
        WorkspaceComponent,
        DesignQuestionComponent
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
        DragDropModule,
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
        FullframeDialogComponent,
        ResourceTypeComponent
    ],
    providers: [
        AppInitService,
        {
            provide: APP_INITIALIZER, useFactory: initializeApp, deps: [AppInitService], multi: true
        },
        {
            provide: KuiCoreConfigToken, useFactory: () => AppInitService.coreConfig
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
