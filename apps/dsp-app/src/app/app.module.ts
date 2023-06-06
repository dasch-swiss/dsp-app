/* eslint-disable max-len */
import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AngularSplitModule } from 'angular-split';
import { MatJDNConvertibleCalendarDateAdapterModule } from '@dasch-swiss/jdnconvertiblecalendardateadapter';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ColorPickerModule } from 'ngx-color-picker';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfirmationDialogComponent } from './main/action/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationMessageComponent } from './main/action/confirmation-dialog/confirmation-message/confirmation-message.component';
import { LoginFormComponent } from './main/action/login-form/login-form.component';
import { ProgressIndicatorComponent } from './main/action/progress-indicator/progress-indicator.component';
import { SelectedResourcesComponent } from './main/action/selected-resources/selected-resources.component';
import { SortButtonComponent } from './main/action/sort-button/sort-button.component';
import { StringLiteralInputComponent } from './main/action/string-literal-input/string-literal-input.component';
import { CookiePolicyComponent } from './main/cookie-policy/cookie-policy.component';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
    DspAppConfigToken,
    DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';
import { DialogHeaderComponent } from './main/dialog/dialog-header/dialog-header.component';
import { DialogComponent } from './main/dialog/dialog.component';
import { AdminImageDirective } from './main/directive/admin-image/admin-image.directive';
import { DisableContextMenuDirective } from './main/directive/disable-context-menu.directive';
import { ExistingNameDirective } from './main/directive/existing-name/existing-name.directive';
import { ExternalLinksDirective } from './main/directive/external-links.directive';
import { InvalidControlScrollDirective } from './main/directive/invalid-control-scroll.directive';

import { FooterComponent } from './main/footer/footer.component';
import { GridComponent } from './main/grid/grid.component';
import { HeaderComponent } from './main/header/header.component';
import { HelpComponent } from './main/help/help.component';
import { FormattedBooleanPipe } from './main/pipes/formatting/formatted-boolean.pipe';
import { KnoraDatePipe } from './main/pipes/formatting/knoradate.pipe';
import { SplitPipe } from './main/pipes/split.pipe';
import { LinkifyPipe } from './main/pipes/string-transformation/linkify.pipe';
import { StringifyStringLiteralPipe } from './main/pipes/string-transformation/stringify-string-literal.pipe';
import { TitleFromCamelCasePipe } from './main/pipes/string-transformation/title-from-camel-case.pipe';
import { TruncatePipe } from './main/pipes/string-transformation/truncate.pipe';
import { TimePipe } from './main/pipes/time.pipe';
import { SelectLanguageComponent } from './main/select-language/select-language.component';
import { DatadogRumService } from './main/services/datadog-rum.service';
import { StatusComponent } from './main/status/status.component';
import { MaterialModule } from './material-module';
import { DescriptionComponent } from './project/description/description.component';
import { AddUserComponent } from './project/collaboration/add-user/add-user.component';
import { CollaborationComponent } from './project/collaboration/collaboration.component';
import { SelectGroupComponent } from './project/collaboration/select-group/select-group.component';
import { ListInfoFormComponent } from './project/list/list-info-form/list-info-form.component';
import { EditListItemComponent } from './project/list/list-item-form/edit-list-item/edit-list-item.component';
import { ListItemFormComponent } from './project/list/list-item-form/list-item-form.component';
import { ListItemComponent } from './project/list/list-item/list-item.component';
import { ListComponent } from './project/list/list.component';
import { OntologyFormComponent } from './project/ontology/ontology-form/ontology-form.component';
import { OntologyComponent } from './project/ontology/ontology.component';
import { PropertyFormComponent } from './project/ontology/property-form/property-form.component';
import { PropertyInfoComponent } from './project/ontology/property-info/property-info.component';
import { ResourceClassFormComponent } from './project/ontology/resource-class-form/resource-class-form.component';
import { ResourceClassInfoComponent } from './project/ontology/resource-class-info/resource-class-info.component';
import { AddGroupComponent } from './project/permission/add-group/add-group.component';
import { PermissionComponent } from './project/permission/permission.component';
import { ProjectFormComponent } from './project/project-form/project-form.component';
import { ProjectComponent } from './project/project.component';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { GroupsListComponent } from './system/groups/groups-list/groups-list.component';
import { GroupsComponent } from './system/groups/groups.component';
import { ProjectsListComponent } from './system/projects/projects-list/projects-list.component';
import { ProjectsComponent } from './system/projects/projects.component';
import { SystemComponent } from './system/system.component';
import { UsersListComponent } from './system/users/users-list/users-list.component';
import { UsersComponent } from './system/users/users.component';
import { AccountComponent } from './user/account/account.component';
import { CollectionListComponent } from './user/collection-list/collection-list.component';
import { MembershipComponent } from './user/membership/membership.component';
import { ProfileComponent } from './user/profile/profile.component';
import { PasswordFormComponent } from './user/user-form/password-form/password-form.component';
import { UserFormComponent } from './user/user-form/user-form.component';
import { UserMenuComponent } from './user/user-menu/user-menu.component';
import { UserComponent } from './user/user.component';
import { ComparisonComponent } from './workspace/comparison/comparison.component';
import { IntermediateComponent } from './workspace/intermediate/intermediate.component';
import { DragDropDirective } from './workspace/resource/directives/drag-drop.directive';
import { TextValueHtmlLinkDirective } from './workspace/resource/directives/text-value-html-link.directive';
import { AddValueComponent } from './workspace/resource/operations/add-value/add-value.component';
import { CreateLinkResourceComponent } from './workspace/resource/operations/create-link-resource/create-link-resource.component';
import { DisplayEditComponent } from './workspace/resource/operations/display-edit/display-edit.component';
import { PermissionInfoComponent } from './workspace/resource/permission-info/permission-info.component';
import { PropertiesComponent } from './workspace/resource/properties/properties.component';
import { AddRegionFormComponent } from './workspace/resource/representation/add-region-form/add-region-form.component';
import { ArchiveComponent } from './workspace/resource/representation/archive/archive.component';
import { AudioComponent } from './workspace/resource/representation/audio/audio.component';
import { AvTimelineComponent } from './workspace/resource/representation/av-timeline/av-timeline.component';
import { DocumentComponent } from './workspace/resource/representation/document/document.component';
import { ReplaceFileFormComponent } from './workspace/resource/representation/replace-file-form/replace-file-form.component';
import { StillImageComponent } from './workspace/resource/representation/still-image/still-image.component';
import { UploadComponent } from './workspace/resource/representation/upload/upload.component';
import { VideoPreviewComponent } from './workspace/resource/representation/video/video-preview/video-preview.component';
import { VideoComponent } from './workspace/resource/representation/video/video.component';
import { ResourceInstanceFormComponent } from './workspace/resource/resource-instance-form/resource-instance-form.component';
import { SelectOntologyComponent } from './workspace/resource/resource-instance-form/select-ontology/select-ontology.component';
import { SelectProjectComponent } from './workspace/resource/resource-instance-form/select-project/select-project.component';
import { SelectPropertiesComponent } from './workspace/resource/resource-instance-form/select-properties/select-properties.component';
import { SwitchPropertiesComponent } from './workspace/resource/resource-instance-form/select-properties/switch-properties/switch-properties.component';
import { SelectResourceClassComponent } from './workspace/resource/resource-instance-form/select-resource-class/select-resource-class.component';
import { ResourceLinkFormComponent } from './workspace/resource/resource-link-form/resource-link-form.component';
import { ResourceComponent } from './workspace/resource/resource.component';
import { BooleanValueComponent } from './workspace/resource/values/boolean-value/boolean-value.component';
import { ColorPickerComponent } from './workspace/resource/values/color-value/color-picker/color-picker.component';
import { ColorValueComponent } from './workspace/resource/values/color-value/color-value.component';
import { DatePickerComponent } from './workspace/resource/values/date-value/date-picker/date-picker.component';
import { DateValueHandlerComponent } from './workspace/resource/values/date-value/date-value-handler/date-value-handler.component';
import { DateValueComponent } from './workspace/resource/values/date-value/date-value.component';
import { DecimalValueComponent } from './workspace/resource/values/decimal-value/decimal-value.component';
import { GeonameValueComponent } from './workspace/resource/values/geoname-value/geoname-value.component';
import { IntValueComponent } from './workspace/resource/values/int-value/int-value.component';
import { IntervalInputComponent } from './workspace/resource/values/interval-value/interval-input/interval-input.component';
import { IntervalValueComponent } from './workspace/resource/values/interval-value/interval-value.component';
import { JDNDatepickerDirective } from './workspace/resource/values/jdn-datepicker-directive/jdndatepicker.directive';
import { LinkValueComponent } from './workspace/resource/values/link-value/link-value.component';
import { ListValueComponent } from './workspace/resource/values/list-value/list-value.component';
import { SublistValueComponent } from './workspace/resource/values/list-value/subList-value/sublist-value.component';
import { TextValueAsHtmlComponent } from './workspace/resource/values/text-value/text-value-as-html/text-value-as-html.component';
import { TextValueAsStringComponent } from './workspace/resource/values/text-value/text-value-as-string/text-value-as-string.component';
import { TextValueAsXMLComponent } from './workspace/resource/values/text-value/text-value-as-xml/text-value-as-xml.component';
import { TimeInputComponent } from './workspace/resource/values/time-value/time-input/time-input.component';
import { TimeValueComponent } from './workspace/resource/values/time-value/time-value.component';
import { UriValueComponent } from './workspace/resource/values/uri-value/uri-value.component';
import { ListViewComponent } from './workspace/results/list-view/list-view.component';
import { ResourceListComponent } from './workspace/results/list-view/resource-list/resource-list.component';
import { ResultsComponent } from './workspace/results/results.component';
import { AdvancedSearchComponent } from './workspace/search/advanced-search/advanced-search.component';
import { ResourceAndPropertySelectionComponent } from './workspace/search/advanced-search/resource-and-property-selection/resource-and-property-selection.component';
import { SearchSelectPropertyComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/search-select-property.component';
import { SearchBooleanValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-boolean-value/search-boolean-value.component';
import { SearchDateValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-date-value/search-date-value.component';
import { SearchDecimalValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-decimal-value/search-decimal-value.component';
import { SearchIntValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-int-value/search-int-value.component';
import { SearchLinkValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-link-value/search-link-value.component';
import { SearchDisplayListComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-list-value/search-display-list/search-display-list.component';
import { SearchListValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-list-value/search-list-value.component';
import { SearchResourceComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-resource/search-resource.component';
import { SearchTextValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-text-value/search-text-value.component';
import { SearchUriValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/search-uri-value/search-uri-value.component';
import { SpecifyPropertyValueComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/specify-property-value.component';
import { SearchSelectResourceClassComponent } from './workspace/search/advanced-search/resource-and-property-selection/search-select-resource-class/search-select-resource-class.component';
import { SearchSelectOntologyComponent } from './workspace/search/advanced-search/search-select-ontology/search-select-ontology.component';
import { ExpertSearchComponent } from './workspace/search/expert-search/expert-search.component';
import { FulltextSearchComponent } from './workspace/search/fulltext-search/fulltext-search.component';
import { SearchPanelComponent } from './workspace/search/search-panel/search-panel.component';
import { HintComponent } from './main/action/hint/hint.component';
import { TextComponent } from './workspace/resource/representation/text/text.component';
import { OntologyClassesComponent } from './project/ontology-classes/ontology-classes.component';
import { OntologyClassItemComponent } from './project/ontology-classes/ontology-class-item/ontology-class-item.component';
import { OntologyClassInstanceComponent } from './project/ontology-classes/ontology-class-instance/ontology-class-instance.component';
import { SettingsComponent } from './project/settings/settings.component';
import { OverviewComponent } from './user/overview/overview.component';
import { ProjectTileComponent } from './system/project-tile/project-tile.component';
import { CommentFormComponent } from './workspace/resource/values/comment-form/comment-form.component';
import { DataModelsComponent } from './project/data-models/data-models.component';
import { ResourceClassPropertyInfoComponent } from '@dsp-app/src/app/project/ontology/resource-class-info/resource-class-property-info/resource-class-property-info.component';
import { AppLogsService } from '@dasch-swiss/vre/shared/app-logs';

// translate: AoT requires an exported function for factories
export function httpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient, 'assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        AccountComponent,
        AddGroupComponent,
        AddRegionFormComponent,
        AddUserComponent,
        AddValueComponent,
        AdminImageDirective,
        AdvancedSearchComponent,
        AppComponent,
        ArchiveComponent,
        AudioComponent,
        AvTimelineComponent,
        DescriptionComponent,
        BooleanValueComponent,
        CollaborationComponent,
        CollectionListComponent,
        ColorPickerComponent,
        ColorValueComponent,
        CommentFormComponent,
        ComparisonComponent,
        ConfirmationDialogComponent,
        ConfirmationMessageComponent,
        CookiePolicyComponent,
        CreateLinkResourceComponent,
        DatePickerComponent,
        DateValueComponent,
        DateValueHandlerComponent,
        DecimalValueComponent,
        DialogComponent,
        DialogHeaderComponent,
        DisableContextMenuDirective,
        DisplayEditComponent,
        DocumentComponent,
        DragDropDirective,
        EditListItemComponent,
        ExistingNameDirective,
        ExpertSearchComponent,
        ExternalLinksDirective,
        FooterComponent,
        FormattedBooleanPipe,
        FulltextSearchComponent,
        GeonameValueComponent,
        GridComponent,
        GroupsComponent,
        GroupsListComponent,
        HeaderComponent,
        HelpComponent,
        IntermediateComponent,
        IntervalInputComponent,
        IntervalValueComponent,
        IntValueComponent,
        InvalidControlScrollDirective,
        JDNDatepickerDirective,
        KnoraDatePipe,
        LinkifyPipe,
        LinkValueComponent,
        ListComponent,
        ListInfoFormComponent,
        ListItemComponent,
        ListItemFormComponent,
        ListValueComponent,
        ListViewComponent,
        LoginFormComponent,
        MembershipComponent,
        OntologyComponent,
        OntologyFormComponent,
        PasswordFormComponent,
        PermissionComponent,
        PermissionInfoComponent,
        ProfileComponent,
        ProgressIndicatorComponent,
        ProjectComponent,
        ProjectFormComponent,
        ProjectsComponent,
        ProjectsListComponent,
        PropertiesComponent,
        PropertyFormComponent,
        PropertyInfoComponent,
        ReplaceFileFormComponent,
        ResourceAndPropertySelectionComponent,
        ResourceClassFormComponent,
        ResourceClassInfoComponent,
        ResourceClassPropertyInfoComponent,
        ResourceComponent,
        ResourceInstanceFormComponent,
        ResourceLinkFormComponent,
        ResourceListComponent,
        ResultsComponent,
        SearchBooleanValueComponent,
        SearchDateValueComponent,
        SearchDecimalValueComponent,
        SearchDisplayListComponent,
        SearchIntValueComponent,
        SearchLinkValueComponent,
        SearchListValueComponent,
        SearchPanelComponent,
        SearchResourceComponent,
        SearchSelectOntologyComponent,
        SearchSelectPropertyComponent,
        SearchSelectResourceClassComponent,
        SearchTextValueComponent,
        SearchUriValueComponent,
        SelectedResourcesComponent,
        SelectGroupComponent,
        SelectLanguageComponent,
        SelectOntologyComponent,
        SelectProjectComponent,
        SelectPropertiesComponent,
        SelectResourceClassComponent,
        SortButtonComponent,
        SpecifyPropertyValueComponent,
        SplitPipe,
        StatusComponent,
        StillImageComponent,
        StringifyStringLiteralPipe,
        StringLiteralInputComponent,
        SublistValueComponent,
        SwitchPropertiesComponent,
        SystemComponent,
        TextValueAsHtmlComponent,
        TextValueAsStringComponent,
        TextValueAsXMLComponent,
        TextValueHtmlLinkDirective,
        TimeInputComponent,
        TimePipe,
        TimeValueComponent,
        TitleFromCamelCasePipe,
        TruncatePipe,
        UploadComponent,
        UriValueComponent,
        UserComponent,
        UserFormComponent,
        UserMenuComponent,
        UsersComponent,
        UsersListComponent,
        VideoComponent,
        VideoPreviewComponent,
        HintComponent,
        TextComponent,
        OntologyClassesComponent,
        OntologyClassItemComponent,
        OntologyClassInstanceComponent,
        SettingsComponent,
        OverviewComponent,
        ProjectTileComponent,
        CommentFormComponent,
        DataModelsComponent,
    ],
    imports: [
        AngularSplitModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        CKEditorModule,
        ClipboardModule,
        ColorPickerModule,
        CommonModule,
        FormsModule,
        HttpClientModule,
        MaterialModule,
        MatJDNConvertibleCalendarDateAdapterModule,
        PdfViewerModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: httpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    providers: [
        AppConfigService,
        DatadogRumService,
        AppLogsService,
        {
            provide: DspApiConfigToken,
            useFactory: (appConfigService: AppConfigService) =>
                appConfigService.dspApiConfig,
            deps: [AppConfigService],
        },
        {
            provide: DspApiConnectionToken,
            useFactory: (appConfigService: AppConfigService) =>
                new KnoraApiConnection(appConfigService.dspApiConfig),
            deps: [AppConfigService],
        },
        {
            provide: DspAppConfigToken,
            useFactory: (appConfigService: AppConfigService) =>
                appConfigService.dspAppConfig,
            deps: [AppConfigService],
        },
        {
            provide: DspInstrumentationToken,
            useFactory: (appConfigService: AppConfigService) =>
                appConfigService.dspInstrumentationConfig,
            deps: [AppConfigService],
        },
        {
            provide: ErrorHandler,
            useClass: AppErrorHandler,
            deps: [AppLogsService],
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
