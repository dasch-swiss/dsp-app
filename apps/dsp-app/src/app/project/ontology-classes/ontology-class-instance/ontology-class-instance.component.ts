import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { AppConfigService, getAllEntityDefinitionsAsArray, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { OntologyService, ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { FilteredResources, SearchParams } from '@dsp-app/src/app/workspace/results/list-view/list-view.component';
import { SplitSize } from '@dsp-app/src/app/workspace/results/results.component';
import { ProjectBase } from '../../project-base';
import { Actions, Store } from '@ngxs/store';
import { Title } from '@angular/platform-browser';
import { OntologiesSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { filter } from 'rxjs/operators';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-ontology-class-instance',
    templateUrl: './ontology-class-instance.component.html',
    styleUrls: ['./ontology-class-instance.component.scss'],
})
export class OntologyClassInstanceComponent extends ProjectBase implements OnInit, OnChanges {
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

    constructor(
        private _acs: AppConfigService,
        private _authService: AuthService,
        protected _route: ActivatedRoute,
        private _ontologyService: OntologyService,
        protected _projectService: ProjectService,
        protected _router: Router,
        private _cdr: ChangeDetectorRef,
        protected _store: Store,
        protected _title: Title,
        protected _actions$: Actions,
    ) {
        super(_store, _route, _projectService, _title, _router, _cdr, _actions$);
    }

    ngOnInit() {
        // this._route.params.subscribe((params) => {
        //     this.initProject(params);
        // });

        this.project$.pipe(
            filter(project => project !== undefined),
        ).subscribe((project) => {
            this.project = project;
            this.initProject(this._route.snapshot.params);
        });
    }

    ngOnChanges() {
        const projectOntologies = this._store.selectSnapshot(OntologiesSelectors.projectOntologies)[this.projectIri];
        // find ontology of current resource class to get the class label
        const ontology = projectOntologies.readOntologies.find((onto) => onto.id === this.ontoId);
        const classes = getAllEntityDefinitionsAsArray(ontology.classes);
        this.resClass = <ResourceClassDefinition>(
            classes[classes.findIndex((res) => res.id === this.classId)]
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
        this._cdr.detectChanges();
    }

    private initProject(params: Params): void {
        const iriBase = this._ontologyService.getIriBaseUrl();
        const ontologyName = params[RouteConstants.ontoParameter];
        const className = params[RouteConstants.classParameter];

        // get the resource ids from the route. Do not use the RouteConstants ontology route constant here,
        // because the ontology and class ids are not defined within the apps domain. They are defined by
        // the api and can not be changed generically via route constants.
        this.ontoId = `${iriBase}/ontology/${this.project.shortcode}/${ontologyName}/v2`;
        this.classId = `${this.ontoId}#${className}`;

        this.instanceId = params[RouteConstants.instanceParameter];
        if (this.instanceId) {
            // single instance view

            if (this.instanceId === RouteConstants.addClassInstance) {
                if (!this._authService.isLoggedIn) {
                    // user isn't signed in, redirect to project description
                    this._router.navigateByUrl(`/${RouteConstants.project}/${this.projectUuid}`);
                } else {
                    const isSysAdmin = this._store.selectSnapshot(UserSelectors.isSysAdmin);
                    const usersProjects = this._store.selectSnapshot(UserSelectors.userProjects);
                    if (
                        usersProjects?.some((p) => p.id === this.projectIri) || // project member
                        isSysAdmin // system admin
                    ) {
                        // user has permission, display create resource instance form
                        this.ngOnChanges();
                    } else {
                        // user is not a member of the project or a systemAdmin, redirect to project description
                        this._router.navigateByUrl(
                            `/${RouteConstants.project}/${this.projectUuid}`,
                        );
                    }
                }
            } else {
                // get the single resource instance
                this.resourceIri = `${this._acs.dspAppConfig.iriBase}/${this.projectUuid}/${this.instanceId}`;
            }
        } else {
            // display all resource instances of this resource class
            this.searchParams = {
                query: this._setGravsearch(this.classId),
                mode: 'gravsearch',
            };
            this._cdr.markForCheck();
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
