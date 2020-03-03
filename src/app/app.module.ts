import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiConfigToken, KuiCoreModule } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { KuiViewerModule } from '@knora/viewer';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppInitService } from './app-init.service';
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
import { SourceTypeFormComponent } from './project/ontology/source-type-form/source-type-form.component';
import { SourceTypePropertyComponent } from './project/ontology/source-type-form/source-type-property/source-type-property.component';
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
import { AdvancedSearchComponent } from './workspace/search/advanced-search/advanced-search.component';
import { ExpertSearchComponent } from './workspace/search/expert-search/expert-search.component';

// translate: AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient, 'assets/i18n/', '.json');
    // return new TranslateHttpLoader(httpClient);
}

export function initializeApp(appInitService: AppInitService) {
    return (): Promise<any> => {
        return appInitService.init();
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
        ResourceTypeComponent,
        ResultsComponent,
        ResourceComponent,
        ExpertSearchComponent,
        AdvancedSearchComponent,
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
        SourceTypeFormComponent,
        SourceTypePropertyComponent,
        OntologyFormComponent,
        ListComponent,
        ListInfoFormComponent,
        ListItemComponent,
        ListItemFormComponent,
        MembershipComponent,
        HelpComponent,
        FooterComponent,
        FilterPipe
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        CommonModule,
        FlexLayoutModule,
        HttpClientModule,
        KuiActionModule,
        KuiCoreModule,
        KuiSearchModule,
        KuiViewerModule,
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
    entryComponents: [DialogComponent],
    providers: [
        AppInitService,
        {
            provide: APP_INITIALIZER,
            useFactory: initializeApp,
            deps: [AppInitService],
            multi: true
        },
        {
            provide: KuiConfigToken,
            useFactory: () => AppInitService.kuiConfig
        },
        {
            provide: KnoraApiConfigToken,
            useFactory: () => AppInitService.knoraApiConfig
        },
        {
            provide: KnoraApiConnectionToken,
            useFactory: () => AppInitService.knoraApiConnection
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
