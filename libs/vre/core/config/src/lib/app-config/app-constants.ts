export const AvailableLanguages = [
  { language: 'en', value: 'English' },
  { language: 'de', value: 'German (Deutsch)' },
  { language: 'fr', value: 'French (Francais)' },
  { language: 'it', value: 'Italian (Italiano)' },
  // Romansh has no translation file yet; the fallback loader serves en.json for 'rm' (DEV-6629).
  { language: 'rm', value: 'Romanic (Rumantsch)' },
] as const;

export type AvailableLanguage = (typeof AvailableLanguages)[number]['language'];

export const AvailableLanguageKeys = AvailableLanguages.map(l => l.language) as readonly AvailableLanguage[];

export const LocalStorageLanguageKey = 'dsp_language';

export class RouteConstants {
  static readonly home = '';
  static readonly help = 'help';
  static readonly userAccount = 'account';
  static readonly settings = 'settings';
  static readonly refresh = 'refresh';

  static readonly projects = 'projects';
  static readonly project = 'project';
  static readonly createNew = 'create-new';
  static readonly collaboration = 'collaboration';
  static readonly edit = 'edit';
  static readonly resourceMetadata = 'resource-metadata';
  static readonly ontology = 'ontology';
  static readonly dataModels = 'data-models';
  static readonly imageSettings = 'image-settings';
  static readonly legalSettings = 'legal-settings';
  static readonly viewRestrictions = 'view-restrictions';

  static readonly myProfile = 'my-profile';
  static readonly data = 'data';
  static readonly resource = 'resource';

  static readonly projectDescription = 'description';
  static readonly advancedSearch = 'advanced-search';
  static readonly search = 'search';
  static readonly system = 'system';
  static readonly systemProjects = 'projects';
  static readonly systemUsers = 'users';

  static readonly editor = 'editor';

  static readonly list = 'list';

  static readonly cookiePolicy = 'cookie-policy';
  static readonly notFound = '404';
  static readonly notFoundWildcard = '**';

  static readonly notAllowed = '403';

  static readonly uuidParameter = 'uuid';
  static readonly ontoParameter = 'onto';
  // Composed into `projectResourceRelative` below — it has no direct consumer of its own, so a
  // repo-wide search for `RouteConstants.projectParameter` finds nothing. Do not remove without
  // checking the `*Relative` members in this file (DEV-7253).
  static readonly projectParameter = 'project';
  // Composed into `projectResourceRelative` below — see the note on `projectParameter`.
  static readonly resourceParameter = 'resource';
  static readonly qParameter = 'q';
  static readonly ontologyParameter = 'ontology';
  static readonly classParameter = 'class';
  static readonly listParameter = 'list';
  static readonly classes = 'classes';
  static readonly properties = 'properties';
  static readonly assignCurrentUser = 'assign-current-user';

  static readonly refreshRelative = `/${RouteConstants.refresh}`;

  static readonly projectRelative = `/${RouteConstants.project}`;
  // Composed into `ontologyEditorRelative` below — see the note on `projectParameter`.
  static readonly ontologyRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}`;
  static readonly ontologyEditorRelative = `${RouteConstants.ontologyRelative}/${RouteConstants.editor}`;
  static readonly projectUuidRelative = `${RouteConstants.project}/:${RouteConstants.uuidParameter}`;
  static readonly createNewProjectRelative = `${RouteConstants.createNew}/${RouteConstants.project}`;
  static readonly projectResourceRelative = `${RouteConstants.resource}/:${RouteConstants.projectParameter}/:${RouteConstants.resourceParameter}`;

  static readonly searchRelative = `${RouteConstants.search}/:${RouteConstants.qParameter}`;

  static readonly annotationQueryParam = 'annotation';

  /**
   * Absolute router commands to a project's Legal Settings tab.
   * Prefer this over hand-building the segments so a route rename only has to happen here.
   */
  static legalSettingsFor(projectUuid: string): readonly string[] {
    return [RouteConstants.project, projectUuid, RouteConstants.settings, RouteConstants.legalSettings];
  }
}

export class ApiConstants {
  static readonly apiKnoraOntologyUrl = 'http://api.knora.org/ontology/knora-api/v2';
}

export enum Auth {
  AccessToken = 'ACCESS_TOKEN',
  Bearer = 'Bearer',
}

export enum MaterialColor {
  Primary = 'primary',
  Warn = 'warn',
  Accent = 'accent',
  Default = 'default',
}
