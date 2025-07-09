import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiResponseError,
  CountQueryResponse,
  KnoraApiConnection,
  ReadResource,
  ReadResourceSequence,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologiesSelectors } from '@dasch-swiss/vre/core/state';
import { FilteredResources, SearchParams } from '@dasch-swiss/vre/shared/app-common-to-move';
import { ComponentCommunicationEventService, EmitEvent, Events } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngxs/store';
import { combineLatest, map, of, Subject, Subscription, switchMap, take, takeUntil, tap } from 'rxjs';

export interface ShortResInfo {
  id: string;
  label: string;
}

/* return the selected resources in below format
 *
 * count: total number of resources selected
 * selectedIds: list of selected resource's ids
 */

/* return the checkbox value
 *
 * checked: checkbox value
 * resIndex: resource index from the list
 */
export interface CheckboxUpdate {
  checked: boolean;
  resIndex: number;
  resId: string;
  resLabel: string;
  isCheckbox: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss'],
})
export class ListViewComponent implements OnChanges, OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @Input() search: SearchParams | undefined = undefined;
  currentSearch: SearchParams | undefined = undefined;

  /**
   * set to true if multiple resources can be selected for comparison
   */
  @Input() withMultipleSelection = false;

  /**
   * emits the selected resources 1-n
   */
  @Output() selectedResources: EventEmitter<FilteredResources> = new EventEmitter<FilteredResources>();

  resources: ReadResource[] = [];

  selectedResourceIdx: number[] = [];

  componentCommsSubscriptions: Subscription[] = [];

  // number of all results including the ones not included as resources in the response bc. the user does not have the permissions to see them
  numberOfAllResults = 0;

  // progress status
  loading = true;

  translation$ = this._translateService.onLangChange.pipe(
    switchMap(() => this._store.select(OntologiesSelectors.projectOntology)),
    map(currentOntology => {
      if (currentOntology !== undefined && !!currentOntology.id) {
        this._dspApiConnection.v2.ontologyCache.reloadCachedItem(currentOntology!.id).pipe(take(1));
      }
    })
  );

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _componentCommsService: ComponentCommunicationEventService,
    private _notification: NotificationService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _cd: ChangeDetectorRef,
    private _store: Store,
    private _translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.componentCommsSubscriptions.push(
      this.translation$.subscribe(() => this.doSearch()),
      this._componentCommsService.on([Events.loginSuccess], () => {
        const currentOntologyClass = this._store.selectSnapshot(OntologiesSelectors.currentOntologyClass);
        if (currentOntologyClass) {
          const currentOntology = this._store.selectSnapshot(OntologiesSelectors.projectOntology);
          this._dspApiConnection.v2.ontologyCache
            .reloadCachedItem(currentOntology.id)
            .pipe(take(1))
            .subscribe(() => {
              this.initSearch();
            });
        }
      })
    );
  }

  ngOnChanges(): void {
    if (this.isCurrentSearch()) {
      this.currentSearch = this.search;
      this.initSearch();
    }
  }

  isCurrentSearch = (): boolean =>
    this.search?.query !== this.currentSearch?.query || this.currentSearch?.query === undefined;

  initSearch(): void {
    // reset
    this.loading = true;
    this.resources = [];
    this._cd.detectChanges();
    this.emitSelectedResources();
    this.doSearch();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // the child component send the selected resources to the parent of this component directly;
  // but when this component is initialized, it should select the first item in the list and
  // emit this selected resource to the parent.
  emitSelectedResources(res?: FilteredResources) {
    if (!res || res.count === 0) {
      // no resource is selected: In case of an error or no search results
      this.selectedResources.emit({
        count: 0,
        resListIndex: [],
        resInfo: [],
        selectionType: 'single',
      });
    } else if (res.count > 0) {
      this.selectedResourceIdx = res.resListIndex;
      this.selectedResources.emit(res);
    }
  }

  handleBackButtonClicked() {
    const projectUuid = this._route.parent?.snapshot.paramMap.get('uuid');
    if (projectUuid) {
      this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.advancedSearch]);
    }
  }

  /**
   * do the search and send the resources to the child components
   * like resource-list, resource-grid or resource-table
   * @param index offset of gravsearch query
   */
  doSearch(index = 0) {
    this.loading = true;

    if (this.search?.mode === 'fulltext') {
      if (index === 0 && !this.isCurrentSearch()) {
        // perform count query
        this._dspApiConnection.v2.search
          .doFulltextSearchCountQuery(this.search.query, index, this.search.filter)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(
            (count: CountQueryResponse) => {
              this.numberOfAllResults = count.numberOfResults;
              if (this.numberOfAllResults === 0) {
                this.emitSelectedResources();
                this.resources = [];
                this.loading = false;
                this._cd.markForCheck();
              }
            },
            error => {
              if (error instanceof ApiResponseError && error.status === 400) {
                this.numberOfAllResults = 0;
              }
              this.loading = false;
              this._cd.markForCheck();
            }
          );
      }

      // perform full text search
      this._dspApiConnection.v2.search
        .doFulltextSearch(this.search.query, index, this.search.filter)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          response => {
            // if the response does not contain any resources even though the search count is greater than 0,
            // it means that the user does not have the permissions to see anything: emit an empty result
            if (response.resources.length === 0) {
              this.emitSelectedResources();
            }
            this.resources = response.resources;
            this.loading = false;
            this._cd.markForCheck();
          },
          error => {
            this.loading = false;
            this.resources = [];
          }
        );
    } else if (this.search?.mode === 'gravsearch') {
      this.performGravSearch(index);
    }
  }

  performGravSearch(index: number) {
    // emit 'gravSearchExecuted' event to the fulltext-search component in order to clear the input field
    this._componentCommsService.emit(new EmitEvent(Events.gravSearchExecuted, true));

    if (this.search?.query === undefined) {
      this._notification.openSnackBar('The gravsearch query is not set correctly');
      this.resources = [];
      this.loading = false;
      this._cd.markForCheck();
      return;
    }

    // request the count query if the page index is zero otherwise it is already stored in the numberOfAllResults
    const numberOfAllResults$ =
      index !== 0
        ? of(this.numberOfAllResults)
        : this._dspApiConnection.v2.search
            .doExtendedSearchCountQuery(this.search.query)
            .pipe(takeUntil(this.ngUnsubscribe))
            .pipe(
              map(count => {
                this.numberOfAllResults = count.numberOfResults;
                if (this.numberOfAllResults === 0) {
                  this._notification.openSnackBar('No resources to display.');
                  this.emitSelectedResources();
                  this.resources = [];
                  this.loading = false;
                  this._cd.markForCheck();
                }

                return count.numberOfResults;
              })
            );

    let gravsearch = this.search.query;
    gravsearch = gravsearch.substring(0, gravsearch.search('OFFSET'));
    gravsearch = `${gravsearch}OFFSET ${index}`;

    const graveSearchQuery$ = this._dspApiConnection.v2.search
      .doExtendedSearch(gravsearch)
      .pipe(takeUntil(this.ngUnsubscribe));

    combineLatest([graveSearchQuery$, numberOfAllResults$])
      .pipe(
        tap({
          error: () => {
            this.loading = false;
            this.resources = [];
          },
        })
      )
      .subscribe(([response, numberOfAllResults]) => {
        response = response as ReadResourceSequence;
        if (this.numberOfAllResults === 0) {
          this.numberOfAllResults = response.resources.length;
        }

        // if the response does not contain any resources even the search count is greater than 0,
        // it means that the user does not have the permissions to see anything: emit an empty result
        if (response.resources.length === 0 && this.numberOfAllResults > 0) {
          this._notification.openSnackBar('No permission to display the resources.');
          this.emitSelectedResources();
        }

        this.resources = response.resources;

        this.loading = false;
        this._cd.markForCheck();
      });
  }
}
