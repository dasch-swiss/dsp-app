import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Constants, ReadUser, StoredProject } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import {
  AddUserToProjectMembershipAction,
  ProjectsSelectors,
  RemoveUserFromProjectAction,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AutocompleteItem } from '../../workspace/search/operator';

// --> TODO replace it by IPermissions from dsp-js
export interface IPermissions {
  groupsPerProject: any;
  administrativePermissionsPerProject: any;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-membership',
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.scss'],
})
export class MembershipComponent implements OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @Input() user: ReadUser;

  @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

  get user$(): Observable<ReadUser> {
    return this.allUsers$.pipe(
      takeUntil(this.ngUnsubscribe),
      map(users => users.find(u => u.id === this.user.id))
    );
  }

  // get all projects and filter by projects where the user is already member of
  get projects$(): Observable<AutocompleteItem[]> {
    return combineLatest([this.allProjects$, this.user$]).pipe(
      takeUntil(this.ngUnsubscribe),
      map(([projects, user]) => this.getProjects(projects, user))
    );
  }

  newProject = new UntypedFormControl();

  // i18n plural mapping
  itemPluralMapping = {
    project: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '=1': '1 project',
      other: '# projects',
    },
  };

  @Select(ProjectsSelectors.allProjects) allProjects$: Observable<StoredProject[]>;
  @Select(UserSelectors.allUsers) allUsers$: Observable<ReadUser[]>;
  @Select(ProjectsSelectors.isProjectsLoading)
  isProjectsLoading$: Observable<boolean>;

  constructor(private _store: Store) {}

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * remove user from project
   *
   * @param iri Project iri
   */
  removeFromProject(iri: string) {
    this._store.dispatch(new RemoveUserFromProjectAction(this.user.id, iri));
  }

  addToProject(iri: string) {
    this._store.dispatch(new AddUserToProjectMembershipAction(this.user.id, iri));
  }

  trackByFn = (index: number, item: StoredProject) => `${index}-${item?.id}`;

  /**
   * returns true, when the user is project admin;
   * when the parameter permissions is not set,
   * it returns the value for the logged-in user
   *
   *
   * @param  [permissions] user's permissions
   * @param  [iri] project id
   * @returns boolean
   */
  userIsProjectAdmin(permissions: PermissionsData, iri: string): boolean {
    return permissions.groupsPerProject[iri].indexOf(Constants.ProjectAdminGroupIRI) > -1;
  }

  private getProjects(projects: StoredProject[], user: ReadUser): AutocompleteItem[] {
    return projects
      .map(p => {
        if (
          p.id !== Constants.SystemProjectIRI &&
          p.id !== Constants.DefaultSharedOntologyIRI &&
          p.status === true &&
          user.projects.findIndex(i => i.id === p.id) === -1
        ) {
          return <AutocompleteItem>{
            iri: p.id,
            name: `${p.longname} (${p.shortname})`,
          };
        }
      })
      .sort(function (u1: AutocompleteItem, u2: AutocompleteItem) {
        if (u1.name < u2.name) {
          return -1;
        } else if (u1.name > u2.name) {
          return 1;
        } else {
          return 0;
        }
      });
  }
}
