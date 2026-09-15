import { AsyncPipe } from '@angular/common';
import { Component, ErrorHandler, Inject, Input, OnChanges, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KnoraApiConnection, ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ErrorReportingService, userFacingReason } from '@dasch-swiss/vre/core/error-handler';
import { MultipleViewerService, ResourcesListComponent } from '@dasch-swiss/vre/pages/data-browser';
import { OntologyService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { CenteredBoxComponent, CenteredMessageComponent, SearchFailedComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  first,
  map,
  Observable,
  of,
  pairwise,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { DataBrowserPageService } from '../../data-browser-page.service';
import { ProjectPageService } from '../../project-page.service';

@Component({
  selector: 'app-resources-list-fetcher',
  template: `
    @let data = data$ | async;
    @if (failed()) {
      <app-centered-box>
        <app-search-failed [reason]="failureReason()" (retry)="onRetry()" />
      </app-centered-box>
    } @else if (data) {
      @if (userCanViewResources) {
        @if (data.resources.length > 0) {
          <app-resources-list [resources]="data.resources" />
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
  imports: [
    AsyncPipe,
    TranslatePipe,
    ResourcesListComponent,
    CenteredBoxComponent,
    CenteredMessageComponent,
    AppProgressIndicatorComponent,
    SearchFailedComponent,
  ],
})
export class ResourcesListFetcherComponent implements OnChanges {
  @Input({ required: true }) ontologyLabel!: string;
  @Input({ required: true }) classLabel!: string;
  userCanViewResources = true;

  readonly failed = signal(false);
  /** dsp-api's own account of the failure, when it gave one fit to show. */
  readonly failureReason = signal<string | undefined>(undefined);

  /** Re-triggers the load after a failure. Replays on subscribe so the initial load runs too. */
  private readonly _retrySubject = new BehaviorSubject<void>(undefined);

  private readonly _classParam$ = this.route.params.pipe(
    map(params => params[RouteConstants.classParameter] as string)
  );

  data$!: Observable<{ resources: ReadResource[]; selectFirstResource: boolean } | null>;

  /**
   * The count only drives the paginator and the permissions heuristic below, but it re-runs the same
   * WHERE clause as the paged query and carries the same cost profile (DEV-6809). Sharing one
   * `combineLatest` meant a count timeout errored the whole stream and threw away resources that had
   * arrived perfectly well, so the count absorbs its own failure and reports an unknown count.
   */
  countQuery$ = (project: ReadProject, ontologyLabel: string, classLabel: string) =>
    this._dspApiConnection.v2.search
      .doExtendedSearchCountQuery(
        this._setGravsearch(this._getClassIdFromParams(project.shortcode, ontologyLabel, classLabel))
      )
      .pipe(
        map(response => response.numberOfResults),
        // Reported, not surfaced: the resources rendered fine and an error toast over a working list is
        // noise, but the cost of this query is exactly what DEV-6809 and DEV-6864 are about, so it must
        // not stay invisible.
        catchError((error: unknown) => {
          this._errorReporting.report(error, {
            component: 'ResourcesListFetcherComponent',
            operation: 'gravsearchCountQuery',
          });
          return of(null);
        })
      );

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _dataBrowserPageService: DataBrowserPageService,
    private readonly _multipleViewerService: MultipleViewerService,
    private readonly _ontologyService: OntologyService,
    private readonly _resourceResult: ResourceResultService,
    private readonly _errorHandler: ErrorHandler,
    private readonly _errorReporting: ErrorReportingService,
    protected route: ActivatedRoute,
    protected router: Router,
    public projectPageService: ProjectPageService
  ) {}

  ngOnChanges() {
    this._resourceResult.updatePageIndex(0);
    this.failed.set(false);
    this.failureReason.set(undefined);

    this.data$ = this._retrySubject.pipe(switchMap(() => this._data$()));
  }

  onRetry() {
    // The retry subject is the outermost operator of `data$`, so re-entering it rebuilds the whole
    // chain — including a fresh `pairwise()`. That matters: `catchError` completes the inner stream,
    // so retrying from anywhere inside it could never emit again.
    this.failed.set(false);
    this._retrySubject.next();
  }

  /**
   * The `catchError` is what keeps the spinner from spinning forever: with no error handling at all,
   * any failure left `data$` non-emitting, so the template's `@else` branch rendered the progress
   * indicator indefinitely — the same dead-end DEV-6866 fixed in the search components.
   */
  private _data$(): Observable<{ resources: ReadResource[]; selectFirstResource: boolean } | null> {
    const resources$ = this._dataBrowserPageService.onNavigationReload$.pipe(
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
        // "The class has resources but none came back" is what distinguishes missing permissions from
        // an empty class. An unknown count cannot support that inference, so it must fall back to
        // can-view: a timed-out count must never tell the user they lack permissions.
        this.userCanViewResources =
          numberOfResults === null || !(pageIndex === 0 && resources.length === 0 && numberOfResults > 0);

        // Passed through unchanged, null included: resources-list states that the count is unavailable
        // rather than asserting a total we do not have.
        this._resourceResult.numberOfResults = numberOfResults;
        return resources;
      })
    );

    return resources$.pipe(
      withLatestFrom(this._classParam$),
      startWith([[] as ReadResource[], null]),
      pairwise(),
      map(([[_prevResources, prevClass], [currResources, currClass]]) => {
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
      }),
      catchError((error: unknown) => {
        // Drop any previously known total: after a failed page change the old count describes results
        // that are no longer on screen, and leaving it would break the service's "null means genuinely
        // unknown" contract for as long as the failure state lasts.
        this._resourceResult.numberOfResults = null;
        // A rejected request explains itself; the panel says so instead of "try again", which cannot
        // work for a request the server will keep rejecting (DEV-6866).
        this.failureReason.set(userFacingReason(error));
        this.failed.set(true);
        // Last, so the failure state is committed before the global handler runs and a throw there
        // cannot bring the eternal spinner back (DEV-6872). It would still error this stream and
        // leave retry dead, which is why `AppErrorHandler.handleError` is written not to throw.
        this._errorHandler.handleError(error);
        return of(null);
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
