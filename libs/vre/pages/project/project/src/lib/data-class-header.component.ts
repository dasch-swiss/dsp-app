import { AsyncPipe } from '@angular/common';
import { Component, computed, ElementRef, inject, Input, viewChild, ViewContainerRef } from '@angular/core';
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
import { combineLatest, first, from, switchMap } from 'rxjs';
import { DataBrowserPageService } from './data-browser-page.service';
import { DataClassResultMetaComponent } from './data-class-result-meta.component';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { DataClassViewToggleComponent } from './data-class-view-toggle.component';
import { DataTabTourComponent, DataTabTourStep } from './data-tab-tour/data-tab-tour.component';
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
 * The class view's two-row header, above the split: class identity and actions, then a toolbar with
 * search and filters, pager, View options and the view toggle.
 */
@Component({
  selector: 'app-data-class-header',
  template: `
    <div class="data-class-header">
      <div class="identity-row">
        <div class="identity">
          <div class="title-line">
            <h1 class="class-label">{{ classSelected.resClass.labels | appStringifyStringLiteral }}</h1>
          </div>
          @if (classSelected.resClass.comments.length) {
            @let description = classSelected.resClass.comments | appStringifyStringLiteral;
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

      <div class="toolbar">
        <!-- Nothing is projected into the bar: the class is fixed by the route and label is the only sort. -->
        <app-advanced-search-bar
          #tourSearchAnchor
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
          <!-- Table view only, and only once the table has reported its columns. -->
          @if ((view$ | async) === 'table' && tableState.columns().length > 0) {
            <app-table-view-options
              [entries]="tableState.pickerEntries()"
              [rowHeight]="tableState.layout().rowHeight"
              (rowHeightChanged)="tableState.setRowHeight($event)"
              (columnVisibilityChanged)="tableState.setColumnVisible($event.key, $event.isVisible)"
              (allColumnsVisibilityChanged)="tableState.setAllColumnsVisible($event)" />
          }
          <app-data-class-view-toggle #tourViewToggleAnchor />
        </div>
      </div>

      @if (isRefreshing()) {
        <mat-progress-bar
          class="refresh-bar"
          mode="indeterminate"
          data-cy="results-refreshing"
          [attr.aria-label]="'pages.dataBrowser.resultMeta.updating' | translate" />
      }

      <app-data-tab-tour [steps]="tourSteps()" />
    </div>
  `,
  styleUrl: './data-class-header.component.scss',
  imports: [
    AsyncPipe,
    MatButton,
    MatIcon,
    MatProgressBar,
    TranslatePipe,
    StringifyStringLiteralPipe,
    AdvancedSearchBarComponent,
    DataClassResultMetaComponent,
    DataClassViewToggleComponent,
    TableViewOptionsComponent,
    DataTabTourComponent,
  ],
  providers: [StringifyStringLiteralPipe],
})
export class DataClassHeaderComponent {
  /** Populated by the table below the split. */
  readonly tableState = inject(TableViewStateService);

  readonly view$ = inject(DataClassUrlStateService).view$;

  /** Whether the results below are being replaced. See `ResourceResultService.isRefreshing`. */
  readonly isRefreshing = computed(() => this._resourceResult.isRefreshing());
  private readonly _resourceResult = inject(ResourceResultService);

  @Input({ required: true }) classSelected!: SelectedClass;

  private readonly _tourSearchAnchor = viewChild('tourSearchAnchor', { read: ElementRef });
  private readonly _tourViewToggleAnchor = viewChild('tourViewToggleAnchor', { read: ElementRef });

  /** The Data tab tour (DEV-7545): what is new in this header, in the order it reads. */
  readonly tourSteps = computed<DataTabTourStep[]>(() => [
    {
      anchor: this._tourSearchAnchor(),
      align: 'start',
      titleKey: 'pages.dataBrowser.tour.searchTitle',
      bodyKey: 'pages.dataBrowser.tour.searchBody',
    },
    {
      anchor: this._tourViewToggleAnchor(),
      align: 'end',
      titleKey: 'pages.dataBrowser.tour.tableTitle',
      bodyKey: 'pages.dataBrowser.tour.tableBody',
    },
  ]);

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
