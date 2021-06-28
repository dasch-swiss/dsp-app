import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AngularSplitModule } from 'angular-split';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AccountComponent } from './user/account/account.component';
import { AddGroupComponent } from './project/permission/add-group/add-group.component';
import { AddressTemplateComponent } from './project/board/address-template/address-template.component';
import { AddUserComponent } from './project/collaboration/add-user/add-user.component';
import { AttributionTabViewComponent } from './project/board/attribution-tab-view/attribution-tab-view.component';
import { BoardComponent } from './project/board/board.component';
import { CollaborationComponent } from './project/collaboration/collaboration.component';
import { CollectionListComponent } from './user/collection-list/collection-list.component';
import { ContactsTabViewComponent } from './project/board/contacts-tab-view/contacts-tab-view.component';
import { CookiePolicyComponent } from './main/cookie-policy/cookie-policy.component';
import { DashboardComponent } from './user/dashboard/dashboard.component';
import { DatasetTabViewComponent } from './project/board/dataset-tab-view/dataset-tab-view.component';
import { DialogComponent } from './main/dialog/dialog.component';
import { DialogHeaderComponent } from './main/dialog/dialog-header/dialog-header.component';
import { EditListItemComponent } from './project/list/list-item-form/edit-list-item/edit-list-item.component';
import { ErrorComponent } from './main/error/error.component';
import { ExternalLinksDirective } from './main/directive/external-links.directive';
import { FooterComponent } from './main/footer/footer.component';
import { GridComponent } from './main/grid/grid.component';
import { GroupsComponent } from './system/groups/groups.component';
import { GroupsListComponent } from './system/groups/groups-list/groups-list.component';
import { HeaderComponent } from './main/header/header.component';
import { HelpComponent } from './main/help/help.component';
import { InvalidControlScrollDirective } from './main/directive/invalid-control-scroll.directive';
import { ListComponent } from './project/list/list.component';
import { ListInfoFormComponent } from './project/list/list-info-form/list-info-form.component';
import { ListItemComponent } from './project/list/list-item/list-item.component';
import { ListItemFormComponent } from './project/list/list-item-form/list-item-form.component';
import { LoginComponent } from './main/login/login.component';
import { MainComponent } from './main/main.component';
import { MaterialModule } from './material-module';
import { MembershipComponent } from './user/membership/membership.component';
import { OntologyComponent } from './project/ontology/ontology.component';
import { OntologyFormComponent } from './project/ontology/ontology-form/ontology-form.component';
import { OntologyVisualizerComponent } from './project/ontology/ontology-visualizer/ontology-visualizer.component';
import { OrganisationTemplateComponent } from './project/board/organisation-template/organisation-template.component';
import { PasswordFormComponent } from './user/user-form/password-form/password-form.component';
import { PermissionComponent } from './project/permission/permission.component';
import { PersonTemplateComponent } from './project/board/person-template/person-template.component';
import { ProfileComponent } from './user/profile/profile.component';
import { ProjectComponent } from './project/project.component';
import { ProjectFormComponent } from './project/project-form/project-form.component';
import { ProjectsComponent } from './system/projects/projects.component';
import { ProjectsListComponent } from './system/projects/projects-list/projects-list.component';
import { ProjectTabViewComponent } from './project/board/project-tab-view/project-tab-view.component';
import { PropertiesComponent } from './workspace/resource/properties/properties.component';
import { PropertyFormComponent } from './project/ontology/property-form/property-form.component';
import { PropertyInfoComponent } from './project/ontology/property-info/property-info.component';
import { ResourceClassFormComponent } from './project/ontology/resource-class-form/resource-class-form.component';
import { ResourceClassInfoComponent } from './project/ontology/resource-class-info/resource-class-info.component';
import { ResourceComponent } from './workspace/resource/resource.component';
import { ResourceInstanceFormComponent } from './workspace/resource/resource-instance-form/resource-instance-form.component';
import { ResultsComponent } from './workspace/results/results.component';
import { SelectGroupComponent } from './project/collaboration/select-group/select-group.component';
import { SelectLanguageComponent } from './main/select-language/select-language.component';
import { SelectOntologyComponent } from './workspace/resource/resource-instance-form/select-ontology/select-ontology.component';
import { SelectProjectComponent } from './workspace/resource/resource-instance-form/select-project/select-project.component';
import { SelectPropertiesComponent } from './workspace/resource/resource-instance-form/select-properties/select-properties.component';
import { SelectResourceClassComponent } from './workspace/resource/resource-instance-form/select-resource-class/select-resource-class.component';
import { StillImageComponent } from './workspace/resource/representation/still-image/still-image.component';
import { SwitchPropertiesComponent } from './workspace/resource/resource-instance-form/select-properties/switch-properties/switch-properties.component';
import { SystemComponent } from './system/system.component';
import { TermsTabViewComponent } from './project/board/terms-tab-view/terms-tab-view.component';
import { UrlTemplateComponent } from './project/board/url-template/url-template.component';
import { UserComponent } from './user/user.component';
import { UserFormComponent } from './user/user-form/user-form.component';
import { UserMenuComponent } from './user/user-menu/user-menu.component';
import { UsersComponent } from './system/users/users.component';
import { UsersListComponent } from './system/users/users-list/users-list.component';
import { VisualizerComponent } from './project/ontology/ontology-visualizer/visualizer/visualizer.component';
import { UploadComponent } from './workspace/resource/representation/upload/upload.component';

// translate: AoT requires an exported function for factories
export function httpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient, 'assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        AccountComponent,
        AddGroupComponent,
        AddressTemplateComponent,
        AddUserComponent,
        AppComponent,
        AttributionTabViewComponent,
        BoardComponent,
        CollaborationComponent,
        CollectionListComponent,
        ContactsTabViewComponent,
        CookiePolicyComponent,
        DashboardComponent,
        DatasetTabViewComponent,
        DialogComponent,
        DialogHeaderComponent,
        EditListItemComponent,
        ErrorComponent,
        ExternalLinksDirective,
        FooterComponent,
        GridComponent,
        GroupsComponent,
        GroupsListComponent,
        HeaderComponent,
        HelpComponent,
        InvalidControlScrollDirective,
        ListComponent,
        ListInfoFormComponent,
        ListItemComponent,
        ListItemFormComponent,
        LoginComponent,
        MainComponent,
        MembershipComponent,
        OntologyComponent,
        OntologyFormComponent,
        OntologyVisualizerComponent,
        OrganisationTemplateComponent,
        PasswordFormComponent,
        PermissionComponent,
        PersonTemplateComponent,
        ProfileComponent,
        ProjectComponent,
        ProjectFormComponent,
        ProjectsComponent,
        ProjectsListComponent,
        ProjectTabViewComponent,
        PropertiesComponent,
        PropertyFormComponent,
        PropertyInfoComponent,
        ResourceClassFormComponent,
        ResourceClassInfoComponent,
        ResourceComponent,
        ResourceInstanceFormComponent,
        ResultsComponent,
        SelectGroupComponent,
        SelectLanguageComponent,
        SelectOntologyComponent,
        SelectProjectComponent,
        SelectPropertiesComponent,
        SelectResourceClassComponent,
        StillImageComponent,
        SwitchPropertiesComponent,
        SystemComponent,
        TermsTabViewComponent,
        UrlTemplateComponent,
        UserComponent,
        UserFormComponent,
        UserMenuComponent,
        UsersComponent,
        UsersListComponent,
        VisualizerComponent,
        UploadComponent,
    ],
    imports: [
        AppRoutingModule,
        AngularSplitModule.forRoot(),
        BrowserAnimationsModule,
        BrowserModule,
        ClipboardModule,
        CommonModule,
        DspActionModule,
        DspCoreModule,
        DspSearchModule,
        DspViewerModule,
        FormsModule,
        HttpClientModule,
        MaterialModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: httpLoaderFactory,
                deps: [HttpClient]
            }
        })
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: (appInitService: AppInitService) =>
                (): Promise<void> => appInitService.Init('config', environment),
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
