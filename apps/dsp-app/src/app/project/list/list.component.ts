import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo, StringLiteral } from '@dasch-swiss/dsp-js';
import { AppConfigService, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  DeleteListNodeAction,
  ListsSelectors,
  LoadListsInProjectAction,
  ProjectsSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AppGlobal } from '../../app-global';
import { DIALOG_LARGE } from '../../main/services/dialog-sizes.constant';
import { DialogService } from '../../main/services/dialog.service';
import { ProjectBase } from '../project-base';
import {
  EditListInfoDialogComponent,
  EditListInfoDialogProps,
} from './reusable-list-info-form/edit-list-info-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent extends ProjectBase implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  languagesList: StringLiteral[] = AppGlobal.languagesList;

  // current selected language
  language: string;

  openPanel: number;

  // i18n plural mapping
  itemPluralMapping = {
    list: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 list',
      other: '# lists',
    },
  };

  // disable content on small devices
  disableContent = false;

  private readonly routeListIri$ = this._route.paramMap.pipe(map(params => params.get(RouteConstants.listParameter)));

  list$ = combineLatest([this._store.select(ListsSelectors.listsInProject), this.routeListIri$]).pipe(
    map(([lists, listIri]) => lists.find(i => i.id.includes(listIri)))
  );

  listIri$: Observable<string> = combineLatest([this._route.params, this.project$]).pipe(
    map(([params, project]) => `${this._acs.dspAppConfig.iriBase}/lists/${project.shortcode}/${params['list']}`)
  );

  @Select(ListsSelectors.isListsLoading) isListsLoading$: Observable<boolean>;
  @Select(ListsSelectors.listsInProject) listsInProject$: Observable<ListNodeInfo[]>;

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
    protected _actions$: Actions
  ) {
    super(_store, _route, _projectService, _titleService, _router, _cd, _actions$);
  }

  @HostListener('window:resize', ['$event']) onWindowResize() {
    this.disableContent = window.innerWidth <= 768;
    // reset the page title
    if (!this.disableContent) {
      this._setPageTitle();
    }
  }

  ngOnInit() {
    super.ngOnInit();
    this.disableContent = window.innerWidth <= 768;
    this._setPageTitle();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * open dialog in every case of modification:
   * edit list data, remove list from project etc.
   *
   */
  askToEditList(list: ListNodeInfo) {
    this._matDialog.open<EditListInfoDialogComponent, EditListInfoDialogProps, boolean>(EditListInfoDialogComponent, {
      ...DIALOG_LARGE,
      data: {
        projectIri: this._projectService.uuidToIri(this.projectUuid),
        list,
      },
    });
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
        this._store.dispatch(new LoadListsInProjectAction(this.projectIri));
        this._router.navigate([RouteConstants.project, this.projectUuid, RouteConstants.dataModels]);
      });
  }

  private _setPageTitle() {
    const project = this._store.selectSnapshot(ProjectsSelectors.currentProject);
    this._titleService.setTitle(`Vocabularie(s) in project ${project?.shortname}`);
  }
}
