export class RouteConstants {
    static readonly home = '';
    static readonly help = 'help';
    static readonly login = 'login';
    static readonly logout = 'logout';
    static readonly userAccount = 'account';
    static readonly systemAdmin = 'system';
    static readonly dashboard = 'dashboard';
    static readonly settings = 'settings';
    static readonly refresh = 'refresh';
    static readonly users = 'users';

    static readonly projects = 'projects';
    static readonly project = 'project';
    static readonly createNew = 'create-new';
    static readonly collaboration = 'collaboration';
    static readonly info = 'info';
    static readonly permissions = 'permissions';
    static readonly ontologies = 'ontologies';
    static readonly lists = 'lists';
    static readonly edit = 'edit';
    static readonly addOntology = 'add-ontology';
    static readonly ontology = 'ontology';
    static readonly dataModels = 'data-models';

    static readonly resource = 'resource';
    static readonly profile = 'profile';

    static readonly advancedSearch = 'advanced-search';
    static readonly gravsearch = 'gravsearch';
    static readonly search = 'search';
    static readonly system = 'system';
    static readonly systemProjects = 'projects';
    static readonly systemUsers = 'users';

    static readonly editor = 'editor';
    static readonly conf = 'conf';

    static readonly list = 'list';
    static readonly addList = 'add-list';

    static readonly cookiePolicy = 'cookie-policy';
    static readonly teapot = 'teapot';
    static readonly noNetworkError = 'no-network';
    static readonly notFound = '404';
    static readonly notImplemented = '501';
    static readonly notFoundWildcard = '**';

    static readonly uuidParameter = 'uuid';
    static readonly ontoParameter = 'onto';
    static readonly projectParameter = 'project';
    static readonly resourceParameter = 'resource';
    static readonly valueParameter = 'value';
    static readonly modeParameter = 'mode';
    static readonly qParameter = 'q';
    static readonly viewParameter = 'view';
    static readonly classParameter = 'class';
    static readonly instanceParameter = 'instance';
    static readonly listParameter = 'list';

    static readonly homeRelative = `/${RouteConstants.home}`;
    static readonly dashboardRelative = `/${RouteConstants.dashboard}`;
    static readonly userAccountRelative = `/${RouteConstants.userAccount}`;
    static readonly systemAdminRelative = `/${RouteConstants.systemAdmin}`;

    static readonly projectsRelative = `/${RouteConstants.projects}`;
    static readonly projectRelative = `/${RouteConstants.project}`;
    static readonly newProjectRelative = `/${RouteConstants.project}/${RouteConstants.createNew}`;
    static readonly ontologyRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}`;
    static readonly projectUuidRelative = `${RouteConstants.project}/:${RouteConstants.uuidParameter}`;
    static readonly createNewProjectRelative = `${RouteConstants.project}/${RouteConstants.createNew}`;
    static readonly projectResourceValueRelative = `:${RouteConstants.projectParameter}/:${RouteConstants.resourceParameter}/:${RouteConstants.valueParameter}`;
    static readonly projectResourceRelative = `:${RouteConstants.projectParameter}/:${RouteConstants.resourceParameter}`;

    static readonly OntologyEditorViewRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}/${RouteConstants.editor}/:${RouteConstants.viewParameter}`;
    static readonly OntologyClassRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}/:${RouteConstants.classParameter}`;
    static readonly OntologyClassConfRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}/:${RouteConstants.classParameter}/${RouteConstants.conf}`;
    static readonly OntologyClassInstanceRelative = `${RouteConstants.ontology}/:${RouteConstants.ontoParameter}/:${RouteConstants.classParameter}/:${RouteConstants.instanceParameter}`;

    static readonly advancedSearchResultsRelative = `${RouteConstants.advancedSearch}/:${RouteConstants.modeParameter}/:${RouteConstants.qParameter}`;
    static readonly searchProjectRelative = `:${RouteConstants.modeParameter}/:${RouteConstants.qParameter}/:${RouteConstants.projectParameter}`;
    static readonly searchRelative = `:${RouteConstants.modeParameter}/:${RouteConstants.qParameter}`;

    static readonly notFoundWildcardRelative = `/${RouteConstants.notFound}`;
}

export enum Auth {
    AccessToken = 'ACCESS_TOKEN',
    Refresh_token = 'REFRESH_TOKEN',
    Bearer = 'Bearer',
}
