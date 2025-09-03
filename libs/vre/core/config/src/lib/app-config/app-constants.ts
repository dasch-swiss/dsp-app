export type DaschLanguage = 'en' | 'de' | 'fr' | 'it' | 'rm';

export const AvailableLanguages: { language: DaschLanguage; value: string }[] = [
  {
    language: 'en',
    value: 'English',
  },
  {
    language: 'de',
    value: 'German (Deutsch)',
  },
  {
    language: 'fr',
    value: 'French (Francais)',
  },
  {
    language: 'it',
    value: 'Italian (Italiano)',
  },
  {
    language: 'rm',
    value: 'Romanic (Rumantsch)',
  },
] as const;

export const LocalStorageLanguageKey = 'dsp_language';

export class RouteConstants {
  static readonly home = '';
  static readonly help = 'help';
  static readonly userAccount = 'account';
  static readonly systemAdmin = 'system';
  static readonly settings = 'settings';
  static readonly refresh = 'refresh';
  static readonly users = 'users';
  static readonly logout = 'logout';

  static readonly projects = 'projects';
  static readonly project = 'project';
  static readonly createNew = 'create-new';
  static readonly collaboration = 'collaboration';
  static readonly ontologies = 'ontologies';
  static readonly lists = 'lists';
  static readonly edit = 'edit';
  static readonly resourceMetadata = 'resource-metadata';
  static readonly addOntology = 'add-ontology';
  static readonly ontology = 'ontology';
  static readonly dataModels = 'data-models';
  static readonly imageSettings = 'image-settings';
  static readonly legalSettings = 'legal-settings';

  static readonly resource = 'resource';

  static readonly projectDescription = 'description';
  static readonly advancedSearch = 'advanced-search';
  static readonly gravSearch = 'gravsearch';
  static readonly search = 'search';
  static readonly system = 'system';
  static readonly systemProjects = 'projects';
  static readonly systemUsers = 'users';

  static readonly editor = 'editor';

  static readonly list = 'list';
  static readonly addClassInstance = 'add';

  static readonly cookiePolicy = 'cookie-policy';
  static readonly notFound = '404';
  static readonly notFoundWildcard = '**';

  static readonly uuidParameter = 'uuid';
  static readonly ontoParameter = 'onto';
  static readonly projectParameter = 'project';
  static readonly resourceParameter = 'resource';
  static readonly modeParameter = 'mode';
  static readonly qParameter = 'q';
  static readonly classParameter = 'class';
  static readonly instanceParameter = 'instance';
  static readonly listParameter = 'list';
  static readonly classes = 'classes';
  static readonly properties = 'properties';
  static readonly assignCurrentUser = 'assign-current-user';

  static readonly homeRelative = `/${RouteConstants.home}`;
  static readonly userAccountRelative = `/${RouteConstants.userAccount}`;
  static readonly refreshRelative = `/${RouteConstants.refresh}`;

  static readonly projectsRelative = `/${RouteConstants.projects}`;
  static readonly projectRelative = `/${RouteConstants.project}`;
  static readonly projectEditRelative = `${RouteConstants.settings}/${RouteConstants.edit}`;
  static readonly ontologyRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}`;
  static readonly ontologyEditorRelative = `${RouteConstants.ontologyRelative}/${RouteConstants.editor}`;
  static readonly projectUuidRelative = `${RouteConstants.project}/:${RouteConstants.uuidParameter}`;
  static readonly createNewProjectRelative = `${RouteConstants.project}/${RouteConstants.createNew}`;
  static readonly projectResourceRelative = `${RouteConstants.resource}/:${RouteConstants.projectParameter}/:${RouteConstants.resourceParameter}`;

  static readonly OntologyClassAddRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}/:${RouteConstants.classParameter}/${RouteConstants.addClassInstance}`;
  static readonly OntologyClassRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}/:${RouteConstants.classParameter}`;
  static readonly JulienOntologyClassRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}/:${RouteConstants.classParameter}/:${RouteConstants.instanceParameter}`;

  static readonly advancedSearchResultsRelative = `${RouteConstants.advancedSearch}/:${RouteConstants.modeParameter}/:${RouteConstants.qParameter}`;
  static readonly searchProjectRelative = `:${RouteConstants.modeParameter}/:${RouteConstants.qParameter}/:${RouteConstants.projectParameter}`;
  static readonly searchRelative = `:${RouteConstants.modeParameter}/:${RouteConstants.qParameter}`;

  static readonly notFoundWildcardRelative = `/${RouteConstants.notFound}`;

  static readonly annotationQueryParam = 'annotation';
}

export class ApiConstants {
  static readonly apiKnoraOntologyUrl = 'http://api.knora.org/ontology/knora-api/v2';
}

export enum Auth {
  AccessToken = 'ACCESS_TOKEN',
  Refresh_token = 'REFRESH_TOKEN',
  Bearer = 'Bearer',
}

export enum MaterialColor {
  Primary = 'primary',
  Warn = 'warn',
  Accent = 'accent',
  Default = 'default',
}
