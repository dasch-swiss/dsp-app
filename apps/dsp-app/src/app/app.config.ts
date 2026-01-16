import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, inject, NgZone, provideAppInitializer } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { GrafanaFaroService } from '@dasch-swiss/vre/3rd-party-services/analytics';
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
import { apiConnectionTokenProvider } from '@dasch-swiss/vre/pages/user-settings/user';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { provideCalendarDateAdapter } from '@dasch-swiss/vre/ui/date-picker';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptorFn } from './main/http-interceptors/auth.interceptor.fn';
import { iiifWithCredentialsInterceptorFn } from './main/http-interceptors/iiif-with-credentials.interceptor.fn';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptorFn, iiifWithCredentialsInterceptorFn])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: 'assets/i18n/', suffix: '.json' }),
    }),
    AppConfigService,
    GrafanaFaroService,
    // Faro is lazy-loaded in its setup() method to reduce initial bundle size
    provideAppInitializer(() => {
      const faroService = inject(GrafanaFaroService);
      return faroService.setup();
    }),
    // Sentry is lazy-loaded in main.ts to reduce initial bundle size
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
    LocalizationService,
    ...provideCalendarDateAdapter(),
  ],
};
