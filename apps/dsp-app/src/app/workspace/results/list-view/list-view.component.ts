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
  IFulltextSearchParams,
  KnoraApiConnection,
  ReadResourceSequence,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { Store } from '@ngxs/store';
import { Subject, Subscription, combineLatest, of } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import {
  ComponentCommunicationEventService,
  EmitEvent,
  Events,
} from '../../../main/services/component-communication-event.service';

/**
 * query: search query. It can be gravserch query or fulltext string query.
 * The query value is expected to have at least length of 3 characters.
 *
 * mode: search mode "fulltext" OR "gravsearch"
 *
 * filter: Optional fulltext search parameter with following (optional) properties:
 *   - limitToResourceClass: string; Iri of resource class the fulltext search is restricted to, if any.
 *   - limitToProject: string; Iri of the project the fulltext search is restricted to, if any.
 *   - limitToStandoffClass: string; Iri of standoff class the fulltext search is restricted to, if any.
 */
export interface SearchParams {
  query: string;
  mode: 'fulltext' | 'gravsearch';
  filter?: IFulltextSearchParams;
  projectUuid?: string;
}

export interface ShortResInfo {
  id: string;
  label: string;
}

/* return the selected resources in below format
 *
 * count: total number of resources selected
 * selectedIds: list of selected resource's ids
 */
export interface FilteredResources {
  count: number;
  resListIndex: number[];
  resInfo: ShortResInfo[];
  selectionType: 'multiple' | 'single';
}

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

  @Input() search: SearchParams;
  currentSearch: SearchParams;

  /**
   * set to true if multiple resources can be selected for comparison
   */
  @Input() withMultipleSelection?: boolean = false;

  /**
   * emits the selected resources 1-n
   */
  @Output() selectedResources: EventEmitter<FilteredResources> = new EventEmitter<FilteredResources>();

  resources: ReadResourceSequence;

  selectedResourceIdx: number[] = [];

  componentCommsSubscriptions: Subscription[] = [];

  resetCheckBoxes = false;

  // number of all results including the ones not included as resources in the response bc. the user does not have the permissions to see them
  numberOfAllResults: number;

  // progress status
  loading = true;

  currentIndex = 0;

  currentRangeStart = 1;

  currentRangeEnd = 0;

  pageSize = 25;

  previousDisabled = false;

  nextDisabled = false;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _componentCommsService: ComponentCommunicationEventService,
    private _notification: NotificationService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _cd: ChangeDetectorRef,
    private _store: Store
  ) {}

  ngOnInit(): void {
    this.componentCommsSubscriptions.push(
      this._componentCommsService.on(Events.resourceChanged, () => this._doSearch()),
      this._componentCommsService.on(Events.resourceDeleted, () => this._doSearch())
    );
  }

  ngOnChanges(): void {
    if (this.isCurrentSearch()) {
      this.currentSearch = this.search;
      this.initSearch();
    }
  }

  isCurrentSearch = (): boolean =>
    this.search.query !== this.currentSearch?.query || this.currentSearch.query === undefined;

  initSearch(): void {
    // reset
    this.currentIndex = 0;
    this.currentRangeStart = 1;
    this.currentRangeEnd = 0;
    this.nextDisabled = false;
    this.resources = undefined;
    this.emitSelectedResources();

    this._doSearch();
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

  goToPage(direction: 'previous' | 'next') {
    if (direction === 'previous') {
      if (this.currentIndex > 0) {
        this.nextDisabled = false;
        this.currentIndex -= 1;
      }
    }
    if (direction === 'next') {
      this.currentIndex += 1;

      // if end range for the next page of results is greater than the total number of results
      if (this.pageSize * (this.currentIndex + 1) >= this.numberOfAllResults) {
        this.nextDisabled = true;
      }
    }

    this._calculateRange(this.currentIndex);

    this._doSearch(this.currentIndex);
  }

  handleBackButtonClicked() {
    const projectUuid = this._route.parent.snapshot.paramMap.get('uuid');
    if (projectUuid) {
      this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.advancedSearch]);
    }
  }

  /**
   * given the index number, calculate the range of results shown
   * @param index offset of gravsearch query
   */
  private _calculateRange(index: number) {
    this.currentRangeStart = this.pageSize * index + 1;

    if (this.pageSize * (index + 1) > this.numberOfAllResults) {
      this.currentRangeEnd = this.numberOfAllResults;
    } else {
      this.currentRangeEnd = this.pageSize * (index + 1);
    }
  }

  /**
   * do the search and send the resources to the child components
   * like resource-list, resource-grid or resource-table
   * @param index offset of gravsearch query
   */
  private _doSearch(index = 0) {
    this.loading = true;
    this._cd.markForCheck();

    if (this.search.mode === 'fulltext') {
      // search mode: fulltext

      if (index === 0) {
        // perform count query
        this._dspApiConnection.v2.search
          .doFulltextSearchCountQuery(this.search.query, index, this.search.filter)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(
            (count: CountQueryResponse) => {
              this.numberOfAllResults = count.numberOfResults;
              this.currentRangeEnd = this.numberOfAllResults > 25 ? 25 : this.numberOfAllResults;

              if (this.numberOfAllResults === 0) {
                this.emitSelectedResources();
                this.resources = undefined;
                this.loading = false;
                this._cd.markForCheck();
              }
            },
            (countError: ApiResponseError) => {
              if (countError.status === 400) {
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
          (response: ReadResourceSequence) => {
            // if the response does not contain any resources even though the search count is greater than 0,
            // it means that the user does not have the permissions to see anything: emit an empty result
            if (response.resources.length === 0) {
              this.emitSelectedResources();
            }
            this.resources = response;
            this.loading = false;
            this._cd.markForCheck();
          },
          (error: ApiResponseError) => {
            this.loading = false;
            this.resources = undefined;
          }
        );
    } else if (this.search.mode === 'gravsearch') {
      this.performGravSearch(index);
    }
  }

  performGravSearch(index: number) {
    // emit 'gravSearchExecuted' event to the fulltext-search component in order to clear the input field
    this._componentCommsService.emit(new EmitEvent(Events.gravSearchExecuted, true));

    if (this.search.query === undefined) {
      this._notification.openSnackBar('The gravsearch query is not set correctly');
      this.resources = undefined;
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
              map((count: CountQueryResponse) => {
                this.numberOfAllResults = count.numberOfResults;
                this.currentRangeEnd = this.numberOfAllResults > 25 ? 25 : this.numberOfAllResults;
                if (this.numberOfAllResults === 0) {
                  this._notification.openSnackBar('No resources to display.');
                  this.emitSelectedResources();
                  this.resources = undefined;
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
            this.resources = undefined;
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

        this.resources = response;

        this.loading = false;
        this._cd.markForCheck();
      });
  }
}
