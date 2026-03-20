import 'zone.js';

import { APP_INITIALIZER, ErrorHandler, inject, LOCALE_ID } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { KnoraApiConfig, KnoraApiConnection, ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import {
  AppConfigService,
  AppConfigToken,
  BuildTagToken,
  DspApiConfigToken,
  DspApiConnectionToken,
  DspAppConfigToken,
  DspInstrumentationToken,
  RouteConstants,
} from '@dasch-swiss/vre/core/config';
import { AuthService, AutoLoginService, LocalStorageWatcherService, UserService } from '@dasch-swiss/vre/core/session';
import { AdminAPIApiService, BASE_PATH } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { GrafanaFaroService } from '@dasch-swiss/vre/3rd-party-services/analytics';
import { ProjectApiService, UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { LocalizationService, ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ProjectPageService, ProjectPageComponent, ProjectPageGuard } from '@dasch-swiss/vre/pages/project/project';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs';
import { Routes } from '@angular/router';

import { AppComponent } from '@dsp-app/src/app/app.component';
import { FilterBarSearchPageComponent } from './pages/filter-bar-search-page.component';
import { FilterBarSearchPageBComponent } from './pages/filter-bar-search-page-b.component';

// --- Mock config ---
const mockApiConfig = new KnoraApiConfig('http', '0.0.0.0', 3333, '', '', false);
const mockApiConnection = new KnoraApiConnection(mockApiConfig);

// --- Monkey-patch getResource to return mock data for the detail panel ---
const mockResourcesByIri: Record<string, any> = {};
// Label lookup from our mock data
import { MOCK_SEARCH_RESULTS } from './mock-data';
const mockLabelsByIri = Object.fromEntries(MOCK_SEARCH_RESULTS.map(r => [r.iri, r.label]));

function getMockReadResource(iri: string): ReadResource {
  if (!mockResourcesByIri[iri]) {
    const res = new ReadResource();
    res.id = iri;
    res.label = mockLabelsByIri[iri] || 'Unknown Resource';
    res.type = 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#book';
    res.attachedToProject = 'http://rdfh.ch/projects/0803';
    res.attachedToUser = 'http://rdfh.ch/users/root';
    res.creationDate = '2020-01-01T00:00:00Z';
    res.properties = {};
    const resType = res.type;
    res.entityInfo = {
      classes: {
        [resType]: {
          getResourcePropertiesList: () => [],
        },
      },
      properties: {},
      getPropertyDefinitionsByType: () => [],
    } as any;
    res.userHasPermission = 'M';
    mockResourcesByIri[iri] = res;
  }
  return mockResourcesByIri[iri];
}

// Override v2.res.getResource to return mock data
(mockApiConnection.v2.res as any).getResource = (iri: string, _version?: string) => {
  return of(getMockReadResource(iri));
};
// Override v2.search.doExtendedSearch (used by results page)
(mockApiConnection.v2.search as any).doExtendedSearch = () => {
  return of({ resources: [] });
};

// --- Fake ReadProject for Incunabula ---
const mockProject = new ReadProject();
mockProject.id = 'http://rdfh.ch/projects/0803';
mockProject.shortname = 'incunabula';
mockProject.shortcode = '0803';
mockProject.longname = 'Incunabula';
mockProject.description = [{ language: 'en', value: 'A collection of early printed books (incunabula)' }] as any;
mockProject.status = true;

// --- Mock ProjectPageService ---
class MockProjectPageService {
  private _currentProjectSubject = new BehaviorSubject<ReadProject>(mockProject);
  currentProject$ = this._currentProjectSubject.asObservable();
  hasProjectAdminRights$ = of(false);
  hasProjectMemberRights$ = of(true);
  ontologiesMetadata$ = of([]);
  ontologies$ = of([]);

  get currentProject(): ReadProject {
    return mockProject;
  }

  get currentProjectUuid(): string {
    return '0803';
  }

  setup(_projectUuid: string): void {
    // no-op, project is hardcoded
  }

  reloadProject(): void {}
}

// --- Mock ProjectPageGuard that always allows ---
class MockProjectPageGuard {
  canActivate(): Observable<boolean> {
    return of(true);
  }
}

// --- Routes: real ProjectPageComponent with swapped search page ---
const protoRoutes: Routes = [
  {
    path: RouteConstants.projectUuidRelative,
    component: ProjectPageComponent,
    canActivate: [ProjectPageGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: RouteConstants.advancedSearch,
      },
      {
        path: RouteConstants.advancedSearch,
        component: FilterBarSearchPageComponent,
      },
      {
        path: 'advanced-search-b',
        component: FilterBarSearchPageBComponent,
      },
      // Stub routes so navigation tabs don't break
      { path: RouteConstants.data, component: FilterBarSearchPageComponent },
      { path: RouteConstants.dataModels, component: FilterBarSearchPageComponent },
      { path: RouteConstants.search, component: FilterBarSearchPageComponent },
      { path: RouteConstants.settings, component: FilterBarSearchPageComponent },
    ],
  },
  // Redirect root to a project page
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/project/0803',
  },
  { path: '**', redirectTo: '/project/0803' },
];

// --- Bootstrap ---
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(protoRoutes, withComponentInputBinding(), withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideAnimations(),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'en-GB' },

    // Translation — use the real i18n files from dsp-app assets
    provideTranslateService({
      defaultLanguage: 'en',
      loader: provideTranslateHttpLoader({ prefix: 'assets/i18n/', suffix: '.json' }),
    }),
    // Trigger translation loading before app renders
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const translate = inject(TranslateService);
        return () => firstValueFrom(translate.use('en'));
      },
      multi: true,
    },

    // Config tokens
    {
      provide: AppConfigToken,
      useValue: {
        dspRelease: 'prototype-0.1.0',
        apiProtocol: 'http', apiHost: '0.0.0.0', apiPort: 3333, apiPath: '',
        iiifProtocol: 'http', iiifHost: '0.0.0.0', iiifPort: 1024, iiifPath: '',
        ingestUrl: 'http://0.0.0.0:3340',
        geonameToken: 'mock', jsonWebToken: '', logErrors: false, iriBase: 'http://rdfh.ch',
        instrumentation: {
          environment: 'prototype',
          rollbar: { enabled: false, accessToken: '' },
          faro: { enabled: false, collectorUrl: '', appName: 'prototype', sessionTracking: { enabled: false, persistent: false, samplingRate: 1 }, console: { enabled: false, disabledLevels: [] }, tracingCorsUrls: [] },
        },
        featureFlags: { allowEraseProjects: false },
      },
    },
    AppConfigService,
    { provide: DspApiConfigToken, useValue: mockApiConfig },
    { provide: DspApiConnectionToken, useValue: mockApiConnection },
    { provide: DspAppConfigToken, useValue: { geonameToken: 'mock', iriBase: 'http://rdfh.ch' } },
    { provide: DspInstrumentationToken, useValue: { environment: 'prototype', rollbar: { enabled: false, accessToken: '' }, faro: { enabled: false } } },
    { provide: BuildTagToken, useValue: 'prototype-0.1.0' },
    { provide: BASE_PATH, useValue: 'http://0.0.0.0:3333' },

    // Override root-provided services with mocks
    { provide: ProjectPageService, useClass: MockProjectPageService },
    { provide: ProjectPageGuard, useClass: MockProjectPageGuard },
    { provide: AutoLoginService, useValue: { setup: () => {}, hasCheckedCredentials$: new BehaviorSubject(true) } },
    { provide: LocalStorageWatcherService, useValue: { watchAccessToken: () => {} } },
    {
      provide: UserService,
      useValue: {
        user$: of(null),
        isLoggedIn$: of(false),
        isSysAdmin$: of(false),
        loadUser: () => of(null),
      },
    },
    { provide: AuthService, useValue: { logout: () => {}, afterSuccessfulLogin$: () => of(null) } },
    { provide: LocalizationService, useValue: { init: () => {}, getCurrentLanguage: () => 'en', currentLanguage$: of('en'), setLanguage: () => {} } },
    { provide: GrafanaFaroService, useValue: { setup: () => Promise.resolve() } },
    { provide: ProjectApiService, useValue: { get: () => of({ project: mockProject }) } },
    { provide: ProjectService, useValue: { uuidToIri: (uuid: string) => `http://rdfh.ch/projects/${uuid}` } },
    { provide: NotificationService, useValue: { open: () => {}, openSnackBar: () => {} } },
    { provide: ErrorHandler, useValue: { handleError: (err: any) => console.error('[Proto]', err) } },
    // Mock OpenAPI services used by ResourceFetcherService and ProjectShortnameService
    { provide: AdminAPIApiService, useValue: { getAdminProjectsIriProjectiri: () => of({ project: mockProject }) } },
    { provide: UserApiService, useValue: { get: () => of({ user: { id: 'http://rdfh.ch/users/root', email: 'root@example.com', givenName: 'Root', familyName: 'User', username: 'root', status: true, lang: 'en' } }) } },
  ],
}).catch(err => console.error(err));
