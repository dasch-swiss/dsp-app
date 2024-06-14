import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { AppConfigService, DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  DeleteListNodeAction,
  ListsSelectors,
  LoadListsInProjectAction,
  ProjectsSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { DialogService } from '@dasch-swiss/vre/shared/app-ui';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { ProjectBaseService } from './project-base.service';
import {
  EditListInfoDialogComponent,
  EditListInfoDialogProps,
} from './reusable-list-info-form/edit-list-info-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ProjectBaseService],
})
export class ListComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  disableContent = false;

  private readonly routeListIri$ = this._route.paramMap.pipe(map(params => params.get(RouteConstants.listParameter)));

  list$ = combineLatest([this._store.select(ListsSelectors.listsInProject), this.routeListIri$]).pipe(
    map(([lists, listIri]) => lists.find(i => i.id.includes(listIri!)))
  );

  listIri$: Observable<string> = combineLatest([this._route.params, this.projectBaseService.project$]).pipe(
    map(([params, project]) => `${this._acs.dspAppConfig.iriBase}/lists/${project.shortcode}/${params['list']}`)
  );

  @Select(ListsSelectors.isListsLoading) isListsLoading$!: Observable<boolean>;

  constructor(
    private _acs: AppConfigService,
    private _dialog: DialogService,
    private _matDialog: MatDialog,
    protected _route: ActivatedRoute,
    protected _router: Router,
    protected _titleService: Title,
    protected _projectService: ProjectService,
    protected _store: Store,
    protected _cd: ChangeDetectorRef,
    protected _actions$: Actions,
    public projectBaseService: ProjectBaseService
  ) {}

  @HostListener('window:resize', ['$event']) onWindowResize() {
    this.disableContent = window.innerWidth <= 768;
    // reset the page title
    if (!this.disableContent) {
      this._setPageTitle();
    }
  }

  ngOnInit() {
    this.projectBaseService.onInit();
    this.disableContent = window.innerWidth <= 768;
    this._setPageTitle();
  }

  ngOnDestroy() {
    this.projectBaseService.onDestroy();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  editList(list: ListNodeInfo) {
    this._matDialog.open<EditListInfoDialogComponent, EditListInfoDialogProps, boolean>(
      EditListInfoDialogComponent,
      DspDialogConfig.dialogDrawerConfig({
        projectIri: this._projectService.uuidToIri(this.projectBaseService.projectUuid),
        list,
      })
    );
  }

  askToDeleteList(list: ListNodeInfo): void {
    this._dialog
      .afterConfirmation('Do yu want to delete this controlled vocabulary?', list.labels[0].value)
      .pipe(
        take(1),
        switchMap(() => this.listIri$.pipe(map(listIri => this._store.dispatch(new DeleteListNodeAction(listIri)))))
      )
      .pipe(switchMap(() => this._actions$.pipe(ofActionSuccessful(DeleteListNodeAction), take(1))))
      .subscribe(() => {
        this._store.dispatch(new LoadListsInProjectAction(this.projectBaseService.projectIri));
        this._router.navigate([RouteConstants.project, this.projectBaseService.projectUuid, RouteConstants.dataModels]);
      });
  }

  private _setPageTitle() {
    const project = this._store.selectSnapshot(ProjectsSelectors.currentProject);
    this._titleService.setTitle(`Vocabularie(s) in project ${project?.shortname}`);
  }
}
