import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ListNodeInfo, StringLiteral } from '@dasch-swiss/dsp-js';
import {
  AppConfigService,
  RouteConstants,
} from '@dasch-swiss/vre/shared/app-config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import {
  DeleteListNodeAction,
  ListsSelectors,
  LoadListsInProjectAction,
  ProjectsSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { AppGlobal } from '@dsp-app/src/app/app-global';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ProjectBase } from '../project-base';

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

  // selected list iri
  listIri: string = undefined;

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

  get list$(): Observable<ListNodeInfo> {
    return this.listsInProject$.pipe(
      map(lists =>
        this.listIri ? lists.find(i => i.id === this.listIri) : null
      )
    );
  }

  @Select(ListsSelectors.isListsLoading) isListsLoading$: Observable<boolean>;
  @Select(ListsSelectors.listsInProject) listsInProject$: Observable<
    ListNodeInfo[]
  >;

  constructor(
    private _acs: AppConfigService,
    private _dialog: MatDialog,
    protected _route: ActivatedRoute,
    protected _router: Router,
    protected _titleService: Title,
    protected _projectService: ProjectService,
    protected _store: Store,
    protected _cd: ChangeDetectorRef,
    protected _actions$: Actions
  ) {
    super(
      _store,
      _route,
      _projectService,
      _titleService,
      _router,
      _cd,
      _actions$
    );
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

    // set the page title
    this._setPageTitle();

    // get list iri from list name
    this._route.params.subscribe(params => {
      if (this.project) {
        this.listIri = `${this._acs.dspAppConfig.iriBase}/lists/${this.project.shortcode}/${params['list']}`;
      }
    });
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
  openDialog(mode: string, name: string, iri?: string): void {
    const dialogConfig: MatDialogConfig = {
      width: '640px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        mode: mode,
        title: name,
        id: iri,
        project: this.projectUuid,
      },
    };

    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(data => {
      switch (mode) {
        case 'editListInfo': {
          window.location.reload();
          break;
        }
        case 'deleteList': {
          if (typeof data === 'boolean' && data === true) {
            this._store.dispatch(new DeleteListNodeAction(this.listIri));
            this.listIri = undefined;
            this._actions$
              .pipe(ofActionSuccessful(DeleteListNodeAction))
              .pipe(take(1))
              .subscribe(() => {
                this._store.dispatch(
                  new LoadListsInProjectAction(this.projectIri)
                );
                this._router.navigate([
                  RouteConstants.project,
                  this.projectUuid,
                  RouteConstants.dataModels,
                ]);
              });
          }
          break;
        }
      }
    });
  }

  private _setPageTitle() {
    const project = this._store.selectSnapshot(
      ProjectsSelectors.currentProject
    );
    this._titleService.setTitle(
      `Project ${project?.shortname} | List${this.listIri ? '' : 's'}`
    );
  }
}
