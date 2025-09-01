import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KnoraApiConnection, ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { combineLatest, map, pairwise, startWith, switchMap, withLatestFrom } from 'rxjs';
import { ResourceResultService } from './resource-result.service';

@Component({
  selector: 'app-resource-class-browser-page',
  template: `
    <ng-container *ngIf="data$ | async as data">
      <ng-container *ngIf="userCanViewResources; else noAccessTpl">
        <app-resource-browser
          [data]="data"
          [hasRightsToShowCreateLinkObject$]="projectPageService.hasProjectMemberRights$" />
      </ng-container>
    </ng-container>

    <ng-template #noAccessTpl>
      <div style="margin-top: 80px; align-items: center; text-align: center">
        <h3>It seems like you don’t have the necessary permissions.</h3>
        <p>Check with a project admin if you have the necessary permission or if you are logged in.</p>
      </div>
    </ng-template>
  `,
  providers: [ResourceResultService],
})
export class ResourceClassBrowserPageComponent implements OnInit {
  userCanViewResources = true;

  private readonly _resources$ = combineLatest([this.projectPageService.currentProject$, this._route.params]).pipe(
    switchMap(([project, params]) => {
      const ontologyLabel = params[RouteConstants.ontoParameter];
      const classLabel = params[RouteConstants.classParameter];

      return combineLatest([
        this._request$(project, ontologyLabel, classLabel),
        this.countQuery$(project, ontologyLabel, classLabel),
      ]);
    }),
    map(([{ resources, pageIndex }, numberOfResults]) => {
      if (pageIndex === 0 && resources.length === 0 && numberOfResults > 0) {
        this.userCanViewResources = false;
      } else {
        this.userCanViewResources = true;
      }

      this._resourceResult.numberOfResults = numberOfResults;
      return resources;
    })
  );

  private readonly _classParam$ = this._route.params.pipe(
    map(params => params[RouteConstants.classParameter] as string)
  );

  data$ = this._resources$.pipe(
    withLatestFrom(this._classParam$),
    startWith([null, [] as ReadResource[]]),
    pairwise(),
    map(([[prevResources, prevClass], [currResources, currClass]]) => {
      const classParamChanged = prevClass !== currClass;
      return { resources: currResources!, selectFirstResource: classParamChanged };
    })
  );

  countQuery$ = (project: ReadProject, ontologyLabel: string, classLabel: string) =>
    this._dspApiConnection.v2.search
      .doExtendedSearchCountQuery(
        this._setGravsearch(this._getClassIdFromParams(project.shortcode, ontologyLabel, classLabel))
      )
      .pipe(map(response => response.numberOfResults));

  constructor(
    protected _route: ActivatedRoute,
    private _resourceResult: ResourceResultService,
    private _ontologyService: OntologyService,
    protected _router: Router,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    public projectPageService: ProjectPageService
  ) {}

  ngOnInit() {
    this._classParam$.pipe(startWith(null), pairwise()).subscribe(([prev, current]) => {
      if (prev && prev !== current) {
        this._resourceResult.updatePageIndex(0);
      }
    });
  }

  private _request$ = (project: ReadProject, ontologyLabel: string, classLabel: string) =>
    this._resourceResult.pageIndex$.pipe(
      switchMap(pageIndex =>
        this._performGravSearch(
          this._setGravsearch(this._getClassIdFromParams(project.shortcode, ontologyLabel, classLabel)),
          pageIndex
        ).pipe(map(response => ({ resources: response.resources, pageIndex })))
      )
    );

  private _setGravsearch(iri: string): string {
    return `
        PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        CONSTRUCT {

        ?mainRes knora-api:isMainResource true .

        } WHERE {

        ?mainRes a knora-api:Resource .
        ?mainRes rdfs:label ?label .


        ?mainRes a <${iri}> .

        }
        ORDER BY ASC(?label)

        OFFSET 0`;
  }

  private _getClassIdFromParams(projectShortcode: string, ontologyLabel: string, classLabel: string) {
    const ontoId = `${this._ontologyService.getIriBaseUrl()}/ontology/${projectShortcode}/${ontologyLabel}/v2`;
    return `${ontoId}#${classLabel}`;
  }

  private _performGravSearch(query: string, index: number) {
    let gravsearch = query;

    gravsearch = gravsearch.substring(0, gravsearch.search('OFFSET'));
    gravsearch = `${gravsearch}OFFSET ${index}`;

    return this._dspApiConnection.v2.search.doExtendedSearch(gravsearch);
  }
}
