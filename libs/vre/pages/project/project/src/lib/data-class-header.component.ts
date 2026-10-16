import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, Input, ViewContainerRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import {
  MultipleViewerService,
  ResourceClassCountApi,
  TableViewOptionsComponent,
  TableViewStateService,
} from '@dasch-swiss/vre/pages/data-browser';
import { AdvancedSearchBarComponent } from '@dasch-swiss/vre/pages/search/search-filters';
import { filterUndefined, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, distinctUntilChanged, first, from, of, ReplaySubject, switchMap } from 'rxjs';
import { DataBrowserPageService } from './data-browser-page.service';
import { DataClassResultMetaComponent } from './data-class-result-meta.component';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { DataClassViewToggleComponent } from './data-class-view-toggle.component';
import { DownloadDialogComponent } from './download/download-dialog.component';
import { ProjectPageService } from './project-page.service';

interface SelectedClass {
  classLabel: string;
  ontologyLabel: string;
  resClass: ResourceClassDefinitionWithAllLanguages;
}

interface CreateResourceDialogProps {
  resourceType: string;
  resourceClassIri: string;
  projectIri: string;
  projectShortcode: string;
}

/**
 * The class view's two-row header, above the split (PRD §9; DEV-7494, design A1).
 *
 * Row 1 identifies the class and carries its actions; row 2 is a toolbar band with the search and
 * filters, the pager, View options and the view toggle. Both sit above the split rather than inside
 * the list column, so the bar spans the full width and the count describes the whole result set
 * rather than looking like a property of the list.
 */
@Component({
  selector: 'app-data-class-header',
  template: `
    <div class="data-class-header">
      <!-- Row 1 — what this is: the class, how many resources it holds, what it is about, and what
           can be done with it (DEV-7494, design A1). -->
      <div class="identity-row">
        <div class="identity">
          <div class="title-line">
            <h1 class="class-label">{{ classSelected.resClass.labels | appStringifyStringLiteral }}</h1>
            @if (resourceCount(); as count) {
              <span class="resource-count" data-cy="class-resource-count">
                {{
                  (count === 1
                    ? 'pages.dataBrowser.dataClassHeader.resourceCountOne'
                    : 'pages.dataBrowser.dataClassHeader.resourceCount'
                  ) | translate: { count: count | number }
                }}
              </span>
            }
          </div>
          @if (classSelected.resClass.comments.length) {
            @let description = classSelected.resClass.comments | appStringifyStringLiteral;
            <!-- One line; the whole of it on hover. -->
            <p class="class-description" [title]="description">{{ description }}</p>
          }
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="openDownloadDialog()" data-cy="download-btn">
            <mat-icon>download</mat-icon>
            {{ 'pages.dataBrowser.downloadDialog.title' | translate }}
          </button>
          @if (hasProjectMemberRights$ | async) {
            <button mat-flat-button color="primary" (click)="goToAddClassInstance()" data-cy="create-resource-btn">
              <mat-icon>add</mat-icon>
              {{ 'pages.dataBrowser.dataClassPanel.createResource' | translate }}
            </button>
          }
        </div>
      </div>

      <!-- Row 2 — how the results are narrowed and drawn: search and filters on the left; the pager,
           View options and the view toggle on the right. Wraps rather than squeezing on a narrow
           screen. -->
      <div class="toolbar">
        <!-- Nothing projected into either slot: the Data Model, Resource Class and Order By chips are
             advanced search's, and here the class is fixed by the route and label is the only sort. -->
        <app-advanced-search-bar
          class="toolbar-search"
          [projectUuid]="projectUuid"
          density="compact"
          searchFieldWidth="280px"
          searchIconPosition="leading"
          [showSearchLabel]="false"
          searchLabelKey="pages.dataBrowser.dataClassHeader.searchLabel"
          searchPlaceholderKey="pages.dataBrowser.dataClassHeader.searchPlaceholder" />

        <div class="toolbar-end">
          <app-data-class-result-meta />
          <span class="toolbar-divider"></span>
          <!-- Only in table view, and only once the table has told us what its columns are. The list
               view has nothing to shape, and an empty menu is worse than no menu. -->
          @if ((view$ | async) === 'table' && tableState.columns().length > 0) {
            <app-table-view-options
              [entries]="tableState.pickerEntries()"
              [rowHeight]="tableState.layout().rowHeight"
              (rowHeightChanged)="tableState.setRowHeight($event)"
              (columnVisibilityChanged)="tableState.setColumnVisible($event.key, $event.isVisible)"
              (allColumnsVisibilityChanged)="tableState.setAllColumnsVisible($event)" />
          }
          <app-data-class-view-toggle />
        </div>
      </div>

      <!-- On the header's bottom edge while new results load, for the list and the table alike: the
           results stay on screen, and this says they are about to change. -->
      @if (isRefreshing()) {
        <mat-progress-bar
          class="refresh-bar"
          mode="indeterminate"
          data-cy="results-refreshing"
          [attr.aria-label]="'pages.dataBrowser.resultMeta.updating' | translate" />
      }
    </div>
  `,
  styleUrl: './data-class-header.component.scss',
  imports: [
    AsyncPipe,
    DecimalPipe,
    MatButton,
    MatIcon,
    MatProgressBar,
    TranslatePipe,
    StringifyStringLiteralPipe,
    AdvancedSearchBarComponent,
    DataClassResultMetaComponent,
    DataClassViewToggleComponent,
    TableViewOptionsComponent,
  ],
  providers: [StringifyStringLiteralPipe],
})
export class DataClassHeaderComponent {
  /** Shared with the table below the split, which is what populates it. */
  readonly tableState = inject(TableViewStateService);

  readonly view$ = inject(DataClassUrlStateService).view$;

  /** Whether the results below are being replaced. See `ResourceResultService.isRefreshing`. */
  readonly isRefreshing = computed(() => this._resourceResult.isRefreshing());
  private readonly _resourceResult = inject(ResourceResultService);

  @Input({ required: true }) set classSelected(value: SelectedClass) {
    this._classSelected = value;
    this._classIri$.next(value.resClass.id);
  }
  get classSelected(): SelectedClass {
    return this._classSelected;
  }
  private _classSelected!: SelectedClass;
  private readonly _classIri$ = new ReplaySubject<string>(1);
  private readonly _countApi = inject(ResourceClassCountApi);

  /**
   * How many resources the class holds, beside its name — the class's own count, not the filtered
   * result's, which the pager shows. Null while loading or when the count query fails.
   */
  readonly resourceCount = toSignal(
    this._classIri$.pipe(
      distinctUntilChanged(),
      switchMap(classIri => this._countApi.getResourceClassCount(classIri).pipe(catchError(() => of(null))))
    ),
    { initialValue: null }
  );

  hasProjectMemberRights$ = this._projectPageService.hasProjectMemberRights$;

  /** The bare UUID, not the IRI: the bar prefixes it with `http://rdfh.ch/projects/` itself. */
  get projectUuid(): string {
    return this._projectPageService.currentProjectUuid;
  }

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _viewContainerRef: ViewContainerRef,
    private readonly _projectPageService: ProjectPageService,
    private readonly _multipleViewerService: MultipleViewerService,
    private readonly _resClassCountApi: ResourceClassCountApi,
    private readonly _stringifyStringLiteralPipe: StringifyStringLiteralPipe,
    private readonly _notificationService: NotificationService,
    private readonly _dataBrowserPageService: DataBrowserPageService,
    private readonly _translateService: TranslateService
  ) {}

  goToAddClassInstance() {
    const project = this._projectPageService.currentProject;
    from(import('@dasch-swiss/vre/resource-editor/resource-editor').then(m => m.CreateResourceDialogComponent))
      .pipe(
        switchMap(CreateResourceDialogComponent =>
          this._dialog
            .open<any, CreateResourceDialogProps, string>(CreateResourceDialogComponent, {
              ...DspDialogConfig.dialogDrawerConfig(
                {
                  resourceType: this._stringifyStringLiteralPipe.transform(this.classSelected.resClass.labels),
                  resourceClassIri: this.classSelected.resClass.id,
                  projectIri: project.id,
                  projectShortcode: project.shortcode,
                },
                true
              ),
              width: '70vw',
              viewContainerRef: this._viewContainerRef,
            })
            .afterClosed()
        ),
        filterUndefined(),
        switchMap(resourceIri =>
          from(
            import('@dasch-swiss/vre/resource-editor/resource-editor').then(m => ({
              resourceIri,
              ResourceFetcherDialogComponent: m.ResourceFetcherDialogComponent,
            }))
          )
        )
      )
      .subscribe(({ resourceIri, ResourceFetcherDialogComponent }) => {
        this._dataBrowserPageService.reloadNavigation();
        this._dialog.open(ResourceFetcherDialogComponent, {
          ...DspDialogConfig.dialogDrawerConfig({ resourceIri }, true),
          width: `${1200 - this._dialog.openDialogs.length * 40}px`,
        });
      });
  }

  openDownloadDialog() {
    combineLatest([
      this._resClassCountApi.getResourceClassCount(this.classSelected.resClass.id),
      this._multipleViewerService.selectedResources$.pipe(first()),
    ]).subscribe(([resClassCount, resources]) => {
      if (resClassCount === 0 || resources.length === 0) {
        this._notificationService.openSnackBar(
          this._translateService.instant('pages.dataBrowser.downloadDialog.noResources')
        );
        return;
      }

      const properties = generateDspResource(resources[0]).resProps.filter(prop => prop.propDef.isEditable);

      this._dialog.open(DownloadDialogComponent, {
        ...DspDialogConfig.dialogDrawerConfig(
          { resourceCount: resClassCount, resClass: this.classSelected.resClass, properties },
          true
        ),
        width: '100vw',
        maxWidth: '500px',
        minWidth: 0,
      });
    });
  }
}
