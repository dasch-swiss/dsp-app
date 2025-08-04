import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo } from '@dasch-swiss/dsp-js';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import {
  DeleteListNodeAction,
  ListsSelectors,
  LoadListsInProjectAction,
  ProjectsSelectors,
} from '@dasch-swiss/vre/core/state';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { combineLatest, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { ListInfoFormComponent } from './list-info-form/list-info-form.component';
import { ListItemService } from './list-item/list-item.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list',
  templateUrl: './list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
  providers: [ListItemService],
})
export class ListPageComponent implements OnInit, OnDestroy {
  disableContent = false;

  private readonly routeListIri$ = this._route.paramMap.pipe(
    take(1),
    map(params => params.get(RouteConstants.listParameter))
  );

  rootListNodeInfo$ = combineLatest([this._store.select(ListsSelectors.listsInProject), this.routeListIri$]).pipe(
    map(([lists, listIri]) => lists.find(i => i.id.includes(listIri!)))
  );

  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);
  project$ = this._store.select(ProjectsSelectors.currentProject);

  isListsLoading$ = this._store.select(ListsSelectors.isListsLoading);

  private _destroy = new Subject<void>();

  constructor(
    private _actions$: Actions,
    private _dialog: DialogService,
    private _listItemService: ListItemService,
    private _matDialog: MatDialog,
    private _route: ActivatedRoute,
    private _router: Router,
    private _store: Store
  ) {}

  @HostListener('window:resize', ['$event']) onWindowResize() {
    this.disableContent = window.innerWidth <= 768;
  }

  ngOnInit() {
    this.disableContent = window.innerWidth <= 768;
    this.rootListNodeInfo$.pipe(takeUntil(this._destroy)).subscribe(list => {
      if (list && list.isRootNode && list.projectIri) {
        this._listItemService.setProjectInfos(list.projectIri, list.id);
      }
    });

    this._actions$
      .pipe(ofActionSuccessful(DeleteListNodeAction))
      .pipe(takeUntil(this._destroy))
      .subscribe(() => {
        this.navigateToDataModels();
        const projectIri = this._store.selectSnapshot(ProjectsSelectors.currentProject)!.id;
        this._store.dispatch(new LoadListsInProjectAction(projectIri!));
      });
  }

  navigateToDataModels() {
    const projectUuid = this._store.selectSnapshot(ProjectsSelectors.currentProjectsUuid);
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.dataModels]);
  }

  editList(list: ListNodeInfo) {
    this._matDialog.open<ListInfoFormComponent, ListNodeInfo>(
      ListInfoFormComponent,
      DspDialogConfig.dialogDrawerConfig(list, true)
    );
  }

  askToDeleteList(list: ListNodeInfo): void {
    this._dialog
      .afterConfirmation('Do you want to delete this controlled vocabulary?', list.labels[0].value)
      .pipe(
        take(1),
        switchMap(() => this._store.dispatch(new DeleteListNodeAction(list.id)))
      )
      .subscribe();
  }

  ngOnDestroy() {
    this._destroy.next();
    this._destroy.complete();
  }
}
