import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo, ListResponse } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { BehaviorSubject, combineLatest, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ListInfoFormComponent } from './list-info-form/list-info-form.component';
import { ListItemService } from './list-item/list-item.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
  providers: [ListItemService],
  standalone: false,
})
export class ListPageComponent implements OnInit, OnDestroy {
  private _reloadMainListSubject = new BehaviorSubject<null>(null);
  private readonly routeListIri$ = this._reloadMainListSubject.pipe(
    switchMap(() => this._route.paramMap),
    map(params => params.get(RouteConstants.listParameter))
  );

  rootListNodeInfo$ = combineLatest([this.routeListIri$, this._projectPageService.currentProject$]).pipe(
    switchMap(([listIri, project]) =>
      this._listApiService.get(`http://rdfh.ch/lists/${project.shortcode}/${listIri!}`)
    ),
    map(res => (res as ListResponse).list.listinfo)
  );

  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;
  project$ = this._projectPageService.currentProject$;

  isListsLoading$ = of(false);

  private _destroy = new Subject<void>();

  constructor(
    private _dialog: DialogService,
    private _listItemService: ListItemService,
    private _matDialog: MatDialog,
    private _projectPageService: ProjectPageService,
    private _route: ActivatedRoute,
    private _router: Router,
    private _viewContainerRef: ViewContainerRef,
    private _listApiService: ListApiService
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
      .afterConfirmation('Do you want to delete this controlled vocabulary?', list.labels[0].value)
      .pipe(switchMap(() => this._listApiService.deleteListNode(list.id)))
      .subscribe(() => {
        this.navigateToDataModels();
      });
  }

  navigateToDataModels() {
    this._projectPageService.currentProjectUuid$.subscribe(projectUuid => {
      this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.dataModels]);
    });
  }

  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
  }

  private _reloadMainList() {
    this._reloadMainListSubject.next(null);
  }
}
