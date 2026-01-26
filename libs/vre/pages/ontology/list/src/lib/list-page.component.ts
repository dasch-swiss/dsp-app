import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo, ListResponse } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { ProgressIndicatorOverlayComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { CenteredLayoutComponent, DialogService, TruncatePipe } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ListInfoFormComponent } from './list-info-form/list-info-form.component';
import { ListItemComponent } from './list-item/list-item.component';
import { ListItemService } from './list-item/list-item.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  providers: [ListItemService],
  imports: [
    AsyncPipe,
    MatAnchor,
    MatButton,
    MatIcon,
    MatToolbar,
    MatToolbarRow,
    MatTooltip,
    TranslatePipe,
    ProgressIndicatorOverlayComponent,
    ListItemComponent,
    StringifyStringLiteralPipe,
    TruncatePipe,
    CenteredLayoutComponent,
  ],
})
export class ListPageComponent implements OnInit, OnDestroy {
  private _reloadMainListSubject = new BehaviorSubject<null>(null);
  private readonly _routeListIri$ = this._reloadMainListSubject.pipe(
    switchMap(() => this._route.paramMap),
    map(params => params.get(RouteConstants.listParameter))
  );

  rootListNodeInfo$ = combineLatest([this._routeListIri$, this._projectPageService.currentProject$]).pipe(
    switchMap(([listIri, project]) =>
      this._listApiService.get(`http://rdfh.ch/lists/${project.shortcode}/${listIri!}`)
    ),
    map(res => (res as ListResponse).list.listinfo)
  );

  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;
  project$ = this._projectPageService.currentProject$;

  isListsLoading$ = of(false);

  private _destroy = new Subject<void>();
  private readonly _translate = inject(TranslateService);

  constructor(
    private readonly _dialog: DialogService,
    private readonly _listItemService: ListItemService,
    private readonly _matDialog: MatDialog,
    private readonly _projectPageService: ProjectPageService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _viewContainerRef: ViewContainerRef,
    private readonly _listApiService: ListApiService
  ) {}

  ngOnInit() {
    this.rootListNodeInfo$.pipe(takeUntil(this._destroy)).subscribe(list => {
      if (list && list.isRootNode && list.projectIri) {
        this._listItemService.setProjectInfos(list.projectIri, list.id);
      }
    });
  }

  editList(list: ListNodeInfo) {
    this._matDialog
      .open<ListInfoFormComponent, ListNodeInfo>(ListInfoFormComponent, {
        ...DspDialogConfig.dialogDrawerConfig(list, true),
        viewContainerRef: this._viewContainerRef,
      })
      .afterClosed()
      .subscribe(() => {
        this._reloadMainList();
      });
  }

  askToDeleteList(list: ListNodeInfo): void {
    this._dialog
      .afterConfirmation(this._translate.instant('pages.ontology.list.deleteConfirmation'), list.labels[0].value)
      .pipe(switchMap(() => this._listApiService.deleteListNode(list.id)))
      .subscribe(() => {
        this.navigateToDataModels();
      });
  }

  navigateToDataModels() {
    const projectUuid = this._projectPageService.currentProjectUuid;
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.dataModels]);
  }

  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
  }

  private _reloadMainList() {
    this._reloadMainListSubject.next(null);
  }
}
