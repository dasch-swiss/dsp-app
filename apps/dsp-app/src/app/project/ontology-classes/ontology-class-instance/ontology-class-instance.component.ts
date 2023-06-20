import { Component, Inject, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ProjectResponse,
    ReadOntology,
    ResourceClassDefinition,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dsp-app/src/app/main/cache/application-state.service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import {
    Session,
    SessionService,
} from '@dasch-swiss/vre/shared/app-session';
import { OntologyService } from '@dsp-app/src/app/project/ontology/ontology.service';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import {
    FilteredResources,
    SearchParams,
} from '@dsp-app/src/app/workspace/results/list-view/list-view.component';
import { SplitSize } from '@dsp-app/src/app/workspace/results/results.component';

@Component({
    selector: 'app-ontology-class-instance',
    templateUrl: './ontology-class-instance.component.html',
    styleUrls: ['./ontology-class-instance.component.scss'],
})
export class OntologyClassInstanceComponent implements OnChanges {
    projectIri: string;

    ontoId: string;

    // id (iri) of resource class
    classId: string;

    resClass: ResourceClassDefinition;

    // uuid of resource instance
    instanceId: string;
    // id (iri) or resource instance
    resourceIri: string;

    searchParams: SearchParams;

    // which resources are selected?
    selectedResources: FilteredResources;

    // display single resource or intermediate page in case of multiple selection
    viewMode: 'single' | 'intermediate' | 'compare' = 'single';

    splitSizeChanged: SplitSize;

    session: Session;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _acs: AppConfigService,
        private _applicationStateService: ApplicationStateService,
        private _route: ActivatedRoute,
        private _ontologyService: OntologyService,
        private _projectService: ProjectService,
        private _sessionService: SessionService,
        private _router: Router,
        private _errorHandler: ErrorHandlerService
    ) {
        // parameters from the url
        const uuid = this._route.parent.snapshot.params.uuid;

        this.projectIri = this._projectService.uuidToIri(uuid);

        this.session = this._sessionService.getSession();

        this._route.params.subscribe((params) => {
            this._dspApiConnection.admin.projectsEndpoint
                .getProjectByIri(this.projectIri)
                .subscribe((res: ApiResponseData<ProjectResponse>) => {
                    const shortcode = res.body.project.shortcode;
                    const iriBase = this._ontologyService.getIriBaseUrl();

                    const ontologyName = params['onto'];
                    const className = params['class'];

                    // get the resource class id from route
                    this.ontoId = `${iriBase}/ontology/${shortcode}/${ontologyName}/v2`;
                    this.classId = `${this.ontoId}#${className}`;

                    this.instanceId = params['instance'];
                    if (this.instanceId) {
                        // single instance view

                        if (this.instanceId === 'add') {
                            if (!this.session) {
                                // user isn't signed in, redirect to project description
                                this._router.navigateByUrl('/project/' + uuid);
                            } else {
                                this._dspApiConnection.admin.usersEndpoint
                                    .getUserByUsername(this.session.user.name)
                                    .subscribe(
                                        (
                                            res: ApiResponseData<UserResponse>
                                        ) => {
                                            const usersProjects =
                                                res.body.user.projects;
                                            if (
                                                usersProjects?.some(
                                                    (p) =>
                                                        p.id === this.projectIri
                                                ) || // project member
                                                this.session.user.sysAdmin // system admin
                                            ) {
                                                // user has permission, display create resource instance form
                                                this.ngOnChanges();
                                            } else {
                                                // user is not a member of the project or a systemAdmin, redirect to project description
                                                this._router.navigateByUrl(
                                                    '/project/' + uuid
                                                );
                                            }
                                        },
                                        (error: ApiResponseError) => {
                                            this._errorHandler.showMessage(
                                                error
                                            );
                                        }
                                    );
                            }
                        } else {
                            // get the single resource instance
                            this.resourceIri = `${this._acs.dspAppConfig.iriBase}/${shortcode}/${this.instanceId}`;
                        }
                    } else {
                        // display all resource instances of this resource class
                        this.searchParams = {
                            query: this._setGravsearch(this.classId),
                            mode: 'gravsearch',
                        };
                    }
                });
        });
    }

    ngOnChanges() {
        this._applicationStateService.get('currentProjectOntologies').subscribe(
            (ontologies: ReadOntology[]) => {
                // find ontology of current resource class to get the class label
                const classes =
                    ontologies[
                        ontologies.findIndex((onto) => onto.id === this.ontoId)
                    ].getAllClassDefinitions();
                this.resClass = <ResourceClassDefinition>(
                    classes[classes.findIndex((res) => res.id === this.classId)]
                );
            },
            () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the application state
        );
    }

    openSelectedResources(res: FilteredResources) {
        this.selectedResources = res;

        if (!res || res.count <= 1) {
            this.viewMode = 'single';
        } else {
            if (this.viewMode !== 'compare') {
                this.viewMode =
                    res && res.count > 0 ? 'intermediate' : 'single';
            }
        }
    }

    private _setGravsearch(iri: string): string {
        return `
        PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
        CONSTRUCT {

        ?mainRes knora-api:isMainResource true .

        } WHERE {

        ?mainRes a knora-api:Resource .

        ?mainRes a <${iri}> .

        }

        OFFSET 0`;
    }
}
