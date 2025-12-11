import { AsyncPipe } from '@angular/common';
import { Component, Inject, Input, OnChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KnoraApiConnection, ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { MultipleViewerService, ResourcesListComponent } from '@dasch-swiss/vre/pages/data-browser';
import { OntologyService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredMessageComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, first, map, Observable, pairwise, startWith, switchMap, withLatestFrom } from 'rxjs';
import { DataBrowserPageService } from '../../data-browser-page.service';
import { ProjectPageService } from '../../project-page.service';

@Component({
  selector: 'app-resources-list-fetcher',
  template: `
    @if (data$ | async; as data) {
      @if (userCanViewResources) {
        @if (data.resources.length > 0) {
          <app-resources-list [resources]="data.resources" [showBackToFormButton]="false" />
        } @else {
          <app-centered-message [message]="'pages.dataBrowser.resourcesListFetcher.noResourcesFound' | translate" />
        }
      } @else {
        <div style="margin-top: 80px; align-items: center; text-align: center">
          <h3>{{ 'pages.dataBrowser.resourcesListFetcher.noPermissions' | translate }}</h3>
          <p>{{ 'pages.dataBrowser.resourcesListFetcher.checkPermissions' | translate }}</p>
        </div>
      }
    } @else {
      <app-progress-indicator />
    }
  `,
  providers: [ResourceResultService],
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateModule,
    ResourcesListComponent,
    CenteredMessageComponent,
    AppProgressIndicatorComponent,
  ],
})
export class ResourcesListFetcherComponent implements OnChanges {
  @Input({ required: true }) ontologyLabel!: string;
  @Input({ required: true }) classLabel!: string;
  userCanViewResources = true;

  private _resources$!: Observable<ReadResource[]>;

  private readonly _classParam$ = this.route.params.pipe(
    map(params => params[RouteConstants.classParameter] as string)
  );

  data$!: Observable<{ resources: ReadResource[]; selectFirstResource: boolean }>;

  countQuery$ = (project: ReadProject, ontologyLabel: string, classLabel: string) =>
    this._dspApiConnection.v2.search
      .doExtendedSearchCountQuery(
        this._setGravsearch(this._getClassIdFromParams(project.shortcode, ontologyLabel, classLabel))
      )
      .pipe(map(response => response.numberOfResults));

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _dataBrowserPageService: DataBrowserPageService,
    private readonly _multipleViewerService: MultipleViewerService,
    private readonly _ontologyService: OntologyService,
    private readonly _resourceResult: ResourceResultService,
    protected route: ActivatedRoute,
    protected router: Router,
    public projectPageService: ProjectPageService
  ) {}

  ngOnChanges() {
    this._resourceResult.updatePageIndex(0);

    this._resources$ = this._dataBrowserPageService.onNavigationReload$.pipe(
      switchMap(() => this.projectPageService.currentProject$.pipe(first())),
      switchMap(project => {
        const ontologyLabel = this.ontologyLabel;
        const classLabel = this.classLabel;

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

    this.data$ = this._resources$.pipe(
      withLatestFrom(this._classParam$),
      startWith([[] as ReadResource[], null]),
      pairwise(),
      map(([[prevResources, prevClass], [currResources, currClass]]) => {
        const selectFirstResource = prevClass !== currClass;
        if (selectFirstResource && !this._multipleViewerService.selectMode && currResources) {
          if (currResources.length >= 1) {
            this._multipleViewerService.selectOneResource(currResources[0]);
          } else {
            // Clear selection when navigating to a class with no resources
            this._multipleViewerService.reset();
          }
        }
        return { resources: currResources!, selectFirstResource };
      })
    );
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
