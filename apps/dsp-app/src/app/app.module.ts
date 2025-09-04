import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, NgModule, NgZone } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { MatJDNConvertibleCalendarDateAdapterModule } from '@dasch-swiss/jdnconvertiblecalendardateadapter';
import { PendoAnalyticsService } from '@dasch-swiss/vre/3rd-party-services/analytics';
import { BASE_PATH } from '@dasch-swiss/vre/3rd-party-services/open-api';
import {
  AppConfigService,
  buildTagFactory,
  BuildTagToken,
  DspApiConfigToken,
  DspAppConfigToken,
  DspInstrumentationToken,
} from '@dasch-swiss/vre/core/config';
import { AppErrorHandler } from '@dasch-swiss/vre/core/error-handler';
import { DataBrowserComponents } from '@dasch-swiss/vre/pages/data-browser';
import { ListComponents } from '@dasch-swiss/vre/pages/ontology/list';
import { OntologyComponents } from '@dasch-swiss/vre/pages/ontology/ontology';
import { ProjectComponents } from '@dasch-swiss/vre/pages/project/project';
import { AdvancedSearchComponent } from '@dasch-swiss/vre/pages/search/advanced-search';
import { SearchComponents } from '@dasch-swiss/vre/pages/search/search';
import { SystemComponents } from '@dasch-swiss/vre/pages/system/system';
import { apiConnectionTokenProvider, UserComponents } from '@dasch-swiss/vre/pages/user-settings/user';
import { PropertiesDisplayComponents } from '@dasch-swiss/vre/resource-editor/properties-display';
import { RepresentationsComponents } from '@dasch-swiss/vre/resource-editor/representations';
import { ResourceCreatorComponents } from '@dasch-swiss/vre/resource-editor/resource-creator';
import { ResourcePageComponents } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { ResourcePropertiesComponents } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { SegmentSupportComponents } from '@dasch-swiss/vre/resource-editor/segment-support';
import { CommonToMoveComponents } from '@dasch-swiss/vre/shared/app-common-to-move';
import { HelpPageComponents } from '@dasch-swiss/vre/shared/app-help-page';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppDatePickerComponent, DatePickerComponents } from '@dasch-swiss/vre/ui/date-picker';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { AppProgressIndicatorComponent, ProgressIndicatorComponents } from '@dasch-swiss/vre/ui/progress-indicator';
import {
  HumanReadableErrorPipe,
  MultiLanguageTextareaComponent,
  MutiLanguageInputComponent,
  StringLiteralComponents,
} from '@dasch-swiss/vre/ui/string-literal';
import { UiComponents, UiStandaloneComponents } from '@dasch-swiss/vre/ui/ui';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import * as Sentry from '@sentry/angular';
import { IMaskModule } from 'angular-imask';
import { AngularSplitModule } from 'angular-split';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { TemplateSwitcherComponents } from 'template-switcher';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CookieBannerComponent } from './cookie-banner.component';
import { AuthInterceptor } from './main/http-interceptors/auth-interceptor';
import { IiifWithCredentialsInterceptor } from './main/http-interceptors/iiif-with-credentials.interceptor';
import { MaterialModule } from './material-module';

// translate: AoT requires an exported function for factories
export function httpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, 'assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    CookieBannerComponent,
    ...TemplateSwitcherComponents,
    ...ResourcePropertiesComponents,
    ...ResourceCreatorComponents,
    ...SegmentSupportComponents,
    ...ResourcePageComponents,
    ...RepresentationsComponents,
    ...PropertiesDisplayComponents,
    ...CommonToMoveComponents,
    ...ListComponents,
    ...UiComponents,
    ...HelpPageComponents,
    ...ProjectComponents,
    ...UserComponents,
    ...SearchComponents,
    ...DataBrowserComponents,
    ...OntologyComponents,
    ...SystemComponents,
    ...ProgressIndicatorComponents,
    ...DatePickerComponents,
    ...StringLiteralComponents,
  ],
  imports: [
    AngularSplitModule,
    AppDatePickerComponent,
    AppProgressIndicatorComponent,
    HumanReadableErrorPipe,
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CKEditorModule,
    ClipboardModule,
    ColorPickerModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    IMaskModule,
    MaterialModule,
    MatJDNConvertibleCalendarDateAdapterModule,
    MatRippleModule,
    NgxSkeletonLoaderModule,
    PdfViewerModule,
    ReactiveFormsModule,
    AdvancedSearchComponent,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    MultiLanguageTextareaComponent,
    MutiLanguageInputComponent,
    ...UiStandaloneComponents,
  ],
  providers: [
    AppConfigService,
    PendoAnalyticsService,
    {
      provide: DspApiConfigToken,
      useFactory: (appConfigService: AppConfigService) => appConfigService.dspApiConfig,
      deps: [AppConfigService],
    },
    apiConnectionTokenProvider,
    {
      provide: DspAppConfigToken,
      useFactory: (appConfigService: AppConfigService) => appConfigService.dspAppConfig,
      deps: [AppConfigService],
    },
    {
      provide: DspInstrumentationToken,
      useFactory: (appConfigService: AppConfigService) => appConfigService.dspInstrumentationConfig,
      deps: [AppConfigService],
    },
    {
      provide: BuildTagToken,
      useFactory: buildTagFactory,
      deps: [HttpClient],
    },
    {
      provide: BASE_PATH,
      useFactory: (configService: AppConfigService) => configService.dspApiConfig.apiUrl,
      deps: [AppConfigService],
    },
    {
      provide: ErrorHandler,
      useClass: AppErrorHandler,
      deps: [NotificationService, AppConfigService, NgZone],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: IiifWithCredentialsInterceptor,
      multi: true,
    },

    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
    LocalizationService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
