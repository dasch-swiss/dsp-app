import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceClassDefinition, StoredProject } from '@dasch-swiss/dsp-js';
import { AppConfigService, getAllEntityDefinitionsAsArray, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { OntologyService, ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { FilteredResources, SearchParams } from '@dsp-app/src/app/workspace/results/list-view/list-view.component';
import { SplitSize } from '@dsp-app/src/app/workspace/results/results.component';
import { ProjectBase } from '../../project-base';
import { Actions, Select, Store } from '@ngxs/store';
import { Title } from '@angular/platform-browser';
import { IProjectOntologiesKeyValuePairs, OntologiesSelectors, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { map, takeWhile } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject, combineLatest } from 'rxjs';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-ontology-class-instance',
    templateUrl: './ontology-class-instance.component.html',
    styleUrls: ['./ontology-class-instance.component.scss'],
})
export class OntologyClassInstanceComponent extends ProjectBase implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    routeConstants = RouteConstants;
    
    get ontoId$(): Observable<string> {
        return combineLatest([this.project$, this._route.params])
            .pipe(
                takeWhile(([project]) => project !== undefined),
                takeUntil(this.ngUnsubscribe),
                map(([project, params]) => {
                    const iriBase = this._ontologyService.getIriBaseUrl();
                    const ontologyName = params[RouteConstants.ontoParameter];
                    // get the resource ids from the route. Do not use the RouteConstants ontology route constant here,
                    // because the ontology and class ids are not defined within the apps domain. They are defined by
                    // the api and can not be changed generically via route constants.
                    return `${iriBase}/ontology/${project.shortcode}/${ontologyName}/v2`;
                })
            )
    }

    // uuid of resource instance
    get instanceId$(): Observable<string> {
        return this._route.params.pipe(
            takeUntil(this.ngUnsubscribe),
            map(params => {
                return params[RouteConstants.instanceParameter]
            })
        )
    }

    // id (iri) of resource class
    get classId$(): Observable<string> {
        return combineLatest([this.ontoId$, this._route.params])
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map(([ontoId, params]) => {
                    const className = params[RouteConstants.classParameter];
                    return `${ontoId}#${className}`;
                })
            )
    }

    get resClass$(): Observable<ResourceClassDefinition> {
        return combineLatest([this.projectOntologies$, this.classId$, this.ontoId$, this.instanceId$, this.userProjects$, this.isSysAdmin$])
            .pipe(
                takeUntil(this.ngUnsubscribe),
                map(([projectOntologies, classId, ontoId, instanceId, userProjects, isSysAdmin]) => {
                    if (
                        (instanceId !== RouteConstants.addClassInstance 
                            || (instanceId === RouteConstants.addClassInstance && !(userProjects?.some((p) => p.id === this.projectIri) || isSysAdmin)))
                            || !projectOntologies[this.projectIri]
                        ) {
                        return;
                    }
    
                    const ontology = projectOntologies[this.projectIri].readOntologies.find((onto) => onto.id === ontoId);
                    if (ontology) { 
                        // find ontology of current resource class to get the class label
                        const classes = getAllEntityDefinitionsAsArray(ontology.classes);
                        return <ResourceClassDefinition>(classes[classes.findIndex((res) => res.id === classId)]);
                    }
                })
            )
    }

    // id (iri) or resource instance
    get resourceIri$(): Observable<string> {
        return this.instanceId$.pipe(
            takeUntil(this.ngUnsubscribe),
            map(instanceId => instanceId !== RouteConstants.addClassInstance 
                ? `${this._acs.dspAppConfig.iriBase}/${this.projectUuid}/${instanceId}`
                : ''
            )
        )
    }

    get searchParams$(): Observable<SearchParams> {
        return combineLatest([this.classId$, this.instanceId$, this.project$])
            .pipe(
                takeWhile(([project]) => project !== undefined),
                takeUntil(this.ngUnsubscribe),
                map(([classId, instanceId]) => !instanceId 
                    ? <SearchParams>{
                            query: this._setGravsearch(classId),
                            mode: 'gravsearch',
                        }
                    : null
                )
        )
    }

    // which resources are selected?
    selectedResources: FilteredResources;

    // display single resource or intermediate page in case of multiple selection
    viewMode: 'single' | 'intermediate' | 'compare' = 'single';

    splitSizeChanged: SplitSize;

    @Select(OntologiesSelectors.projectOntologies) projectOntologies$: Observable<IProjectOntologiesKeyValuePairs>;
    @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
    @Select(UserSelectors.userProjects) userProjects$: Observable<StoredProject[]>;

    constructor(
        private _acs: AppConfigService,
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
        // waits for current project data to be loaded to the state if not already loaded
        this.project$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => this._cdr.markForCheck()); 
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
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
