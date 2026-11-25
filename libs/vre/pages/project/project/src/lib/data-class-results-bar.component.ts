import { AsyncPipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { KnoraApiConnection, ReadResource, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, DspDialogConfig } from '@dasch-swiss/vre/core/config';
import {
  BulkEditLauncher,
  MultipleViewerService,
  ResourceClassCountApi,
  ResourceListSelectionComponent,
} from '@dasch-swiss/vre/pages/data-browser';
import { GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  first,
  from,
  map,
  mergeMap,
  Observable,
  of,
  ReplaySubject,
  retry,
  startWith,
  switchMap,
  tap,
  timer,
  toArray,
} from 'rxjs';
import { DataClassQueryService } from './data-class-query.service';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { DownloadScope, EXPORT_MAX_RESOURCE_IRIS } from './download/download-dialog-resources-tab.component';
import { DownloadDialogComponent } from './download/download-dialog.component';
import { ProjectPageService } from './project-page.service';

/** Result pages fetched at once while collecting every matching resource for a bulk edit. */
const COLLECT_CONCURRENCY = 4;

/** A failed result page (dev answers 503 under load) is asked again up to this many times, after 1 s then 2 s. */
const COLLECT_RETRIES = 2;

/**
 * The bar between the toolbar and the results: which resources the actions apply to, and Download and
 * Bulk edit for them. The scope is the ticked rows if there are any, else what the search and filters
 * keep, else the whole class.
 */
@Component({
  selector: 'app-data-class-results-bar',
  template: `
    @let total = resourceResult.numberOfResults;
    @let classCount = classCount$ | async;
    @let narrowed = (narrowed$ | async) === true;
    @let selected = (selectedResources$ | async) ?? [];

    <!-- selectMode is a plain field with no change notification: keep it in the template. -->
    @if (selected.length && multipleViewerService.selectMode) {
      <app-resource-list-selection (bulkEdited)="bulkEdited.emit()">
        <ng-container
          [ngTemplateOutlet]="downloadButton"
          [ngTemplateOutletContext]="{ scope: 'selection', count: selected.length, selected }" />
      </app-resource-list-selection>
    } @else {
      <div class="results-bar" data-cy="results-bar">
        <!-- aria-live: filtering changes this count without moving focus. -->
        <span class="scope" data-cy="results-scope" aria-live="polite">
          @if (total !== null) {
            <b class="count">{{ total | number }}</b>
            @if (!narrowed) {
              {{ 'pages.dataBrowser.resultsBar.resources' | translate }}
            } @else if (classCount !== null) {
              {{ 'pages.dataBrowser.resultsBar.ofClass' | translate: { total: (classCount | number) } }}
            } @else {
              {{ 'pages.dataBrowser.resultsBar.match' | translate }}
            }
          }
        </span>
        <span class="spacer"></span>
        @if (narrowed) {
          <ng-container
            [ngTemplateOutlet]="downloadButton"
            [ngTemplateOutletContext]="{ scope: 'search', count: total }" />
        } @else {
          <ng-container
            [ngTemplateOutlet]="downloadButton"
            [ngTemplateOutletContext]="{ scope: 'class', count: classCount }" />
        }

        <!-- Only project members may edit, so the button is not offered to anyone else. -->
        @if (hasProjectMemberRights$ | async) {
          <button
            mat-stroked-button
            data-cy="bulk-edit-all-btn"
            [disabled]="!total || collecting() !== null"
            (click)="bulkEditAll(total ?? 0, narrowed)">
            <mat-icon>edit_note</mat-icon>
            @let progress = collecting();
            @if (progress !== null) {
              {{ 'pages.dataBrowser.resultsBar.collecting' | translate: { percent: progress } }}
            } @else {
              {{
                (narrowed
                  ? 'pages.dataBrowser.resourceListSelection.bulkEdit'
                  : 'pages.dataBrowser.resultsBar.bulkEditAll'
                ) | translate
              }}
              @if (total) {
                <span class="count-badge" data-cy="bulk-edit-count">{{ total | number }}</span>
              }
            }
          </button>
        }
      </div>
    }

    <!-- Hidden while the count loads and when there is nothing to download. -->
    <ng-template #downloadButton let-scope="scope" let-count="count" let-selected="selected">
      @if (count) {
        <button mat-stroked-button (click)="download(count, scope, selected)" data-cy="download-btn">
          <mat-icon>download</mat-icon>
          {{
            (scope === 'class'
              ? 'pages.dataBrowser.downloadDialog.downloadAll'
              : 'pages.dataBrowser.resultsBar.download'
            ) | translate
          }}
          <span class="count-badge" data-cy="download-count">{{ count | number }}</span>
        </button>
      }
    </ng-template>
  `,
  styles: [
    `
      .results-bar {
        /* Dense: the bar sits between the toolbar and the results, so it stays one slim line. */
        --mat-button-filled-container-height: 28px;
        --mat-button-outlined-container-height: 28px;
        --mat-button-text-container-height: 28px;
        --mat-button-filled-horizontal-padding: 10px;
        --mat-button-outlined-horizontal-padding: 10px;
        --mat-button-text-horizontal-padding: 8px;
        --mat-button-filled-label-text-size: 13px;
        --mat-button-outlined-label-text-size: 13px;
        --mat-button-text-label-text-size: 13px;
        --mat-button-filled-icon-spacing: 6px;
        --mat-button-outlined-icon-spacing: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 24px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        color: #374151;
        font-size: 13px;
        white-space: nowrap;
      }
      .results-bar > * {
        flex: none;
      }
      .results-bar > .spacer {
        flex: 1;
      }
      .scope {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .count {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }
      .mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }
      .count-badge {
        /* Aligned to the text's top, the pill is centred on the label's line box. */
        display: inline-block;
        vertical-align: text-top;
        margin-left: 6px;
        padding: 0 6px;
        border-radius: 8px;
        background: #e8eef4;
        color: #336790;
        font-size: 11px;
        line-height: 16px;
      }
    `,
  ],
  imports: [
    AsyncPipe,
    DecimalPipe,
    NgTemplateOutlet,
    MatButton,
    MatIcon,
    TranslatePipe,
    ResourceListSelectionComponent,
  ],
  providers: [StringifyStringLiteralPipe],
})
export class DataClassResultsBarComponent {
  @Input({ required: true }) set classSelected(value: { resClass: ResourceClassDefinitionWithAllLanguages }) {
    this._resClass = value.resClass;
    this._classId$.next(value.resClass.id);
  }
  private _resClass!: ResourceClassDefinitionWithAllLanguages;

  /** Emits once a bulk edit has written values, so the host can reload its results. */
  @Output() bulkEdited = new EventEmitter<void>();

  readonly multipleViewerService = inject(MultipleViewerService);
  readonly resourceResult = inject(ResourceResultService);
  private readonly _urlState = inject(DataClassUrlStateService);
  private readonly _query = inject(DataClassQueryService);
  private readonly _classCountApi = inject(ResourceClassCountApi);
  private readonly _projectPageService = inject(ProjectPageService);
  private readonly _bulkEditLauncher = inject(BulkEditLauncher);
  private readonly _dialog = inject(MatDialog);
  private readonly _dspApiConnection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _stringifyStringLiteralPipe = inject(StringifyStringLiteralPipe);
  private readonly _notification = inject(NotificationService);
  private readonly _translate = inject(TranslateService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly selectedResources$ = this.multipleViewerService.selectedResources$;
  readonly hasProjectMemberRights$ = this._projectPageService.hasProjectMemberRights$;

  /** Percent of result pages read while collecting every match for a bulk edit; null when idle. */
  readonly collecting = signal<number | null>(null);

  /** Only search and filters narrow the results; a sort does not. */
  readonly narrowed$ = combineLatest([this._urlState.fulltextTerm$, this._urlState.filters$]).pipe(
    map(([term, filters]) => !!term || filters.length > 0),
    distinctUntilChanged()
  );

  private readonly _classId$ = new ReplaySubject<string>(1);

  /** The class total, shown against the filtered count and offered by Download all. */
  readonly classCount$ = this._classId$.pipe(
    distinctUntilChanged(),
    switchMap(id =>
      this._classCountApi.getResourceClassCount(id).pipe(
        startWith(null),
        catchError(() => of(null))
      )
    )
  );

  /**
   * Download the class, the ticked rows, or what the search and filters keep. The export takes IRIs for the
   * last two, so a search's matches are read page by page first, like for a bulk edit.
   */
  download(resourceCount: number, scope: DownloadScope, selected?: ReadResource[]): void {
    if (scope === 'selection') {
      this._openDownloadDialog(
        resourceCount,
        scope,
        selected?.map(resource => resource.id)
      );
      return;
    }
    if (scope === 'class') {
      this._openDownloadDialog(resourceCount, scope);
      return;
    }
    if (resourceCount > EXPORT_MAX_RESOURCE_IRIS) {
      this._notification.openSnackBar(
        this._translate.instant('pages.dataBrowser.resultsBar.downloadTooMany', { max: EXPORT_MAX_RESOURCE_IRIS }),
        'error'
      );
      return;
    }
    this._collectMatchingIris(resourceCount)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: iris => this._openDownloadDialog(iris.length, scope, iris),
        error: () => this._collectFailed('pages.dataBrowser.downloadDialog.downloadError'),
      });
  }

  private _openDownloadDialog(resourceCount: number, scope: DownloadScope, resourceIris?: string[]) {
    const resClass = this._resClass;
    // The columns come from the class definition, not from a selected row.
    this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(resClass.id).subscribe(classDefinitions => {
      const properties = GenerateProperty.classProperty(classDefinitions.classes[resClass.id]).filter(
        prop => prop.propDef.isEditable
      );

      // Full-height side panel: the property list scrolls inside it and the actions stay visible.
      this._dialog.open(DownloadDialogComponent, {
        ...DspDialogConfig.dialogDrawerConfig(
          {
            resourceCount,
            scope,
            resourceIris,
            resClass,
            classLabel: this._stringifyStringLiteralPipe.transform(resClass.labels),
            properties,
          },
          true
        ),
        width: '600px',
        maxWidth: '100vw',
        minWidth: 0,
        autoFocus: false,
      });
    });
  }

  /**
   * Bulk edit every resource the current query matches, across all its pages. dsp-api has no bulk
   * endpoint and the panel takes IRIs, so the pages are read first, a few at a time.
   */
  bulkEditAll(total: number, narrowed: boolean): void {
    // The panel's header says which resources these are.
    const scope = this._translate.instant(
      narrowed ? 'pages.dataBrowser.resultsBar.bulkEditScopeFiltered' : 'pages.dataBrowser.resultsBar.bulkEditScopeAll',
      { count: total, class: this._stringifyStringLiteralPipe.transform(this._resClass.labels) }
    );
    this._collectMatchingIris(total)
      .pipe(
        switchMap(iris => this._bulkEditLauncher.open(iris, scope)),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe({
        next: changedIris => {
          changedIris.forEach(iri => this.multipleViewerService.notifyResourceChanged(iri));
          if (changedIris.length) this.bulkEdited.emit();
        },
        error: () => this._collectFailed('pages.dataBrowser.resultsBar.collectFailed'),
      });
  }

  /**
   * The IRIs of every resource the current query matches, across all its pages, in result order. dsp-api has
   * no endpoint for that, so the pages are read a few at a time, with progress in `collecting`. Each page asks
   * for no values (`iriOnly`) and is not turned into resources, so it stays small and reads no ontology.
   */
  private _collectMatchingIris(total: number): Observable<string[]> {
    const pageSize = this.resourceResult.MAX_RESULTS_PER_PAGE;
    const pageCount = Math.ceil(total / pageSize);
    const projectIri = this._projectPageService.currentProject.id;
    let pagesRead = 0;
    this.collecting.set(0);

    return this._query.query$.pipe(
      first(),
      map(iriOnly),
      switchMap(query =>
        from(Array.from({ length: pageCount }, (_, pageIndex) => pageIndex)).pipe(
          mergeMap(
            pageIndex =>
              this._dspApiConnection.v2.search.doExtendedSearchIris(withOffset(query, pageIndex), projectIri).pipe(
                map(iris => ({ pageIndex, iris: iris as string[] })),
                retry({ count: COLLECT_RETRIES, delay: (_, attempt) => timer(attempt * 1000) }),
                tap(() => this.collecting.set(Math.round((++pagesRead / pageCount) * 100)))
              ),
            COLLECT_CONCURRENCY
          ),
          toArray()
        )
      ),
      map(pages => pages.sort((a, b) => a.pageIndex - b.pageIndex).flatMap(page => page.iris)),
      tap(() => this.collecting.set(null))
    );
  }

  private _collectFailed(messageKey: string): void {
    this.collecting.set(null);
    this._notification.openSnackBar(this._translate.instant(messageKey), 'error');
  }
}

/**
 * The query asking for the matching resources without their values: only the main resource stays in the
 * CONSTRUCT clause. The WHERE clause, the filters and the order are kept, so the same resources match.
 */
function iriOnly(query: string): string {
  return query.replace(
    /CONSTRUCT\s*\{[\s\S]*?\}\s*WHERE\s*\{/,
    'CONSTRUCT {\n?mainRes knora-api:isMainResource true .\n} WHERE {'
  );
}

/** `lastIndexOf`: a fulltext term can contain the word OFFSET. */
function withOffset(query: string, pageIndex: number): string {
  const offsetAt = query.lastIndexOf('OFFSET');
  return `${offsetAt === -1 ? query : query.substring(0, offsetAt)}OFFSET ${pageIndex}`;
}
