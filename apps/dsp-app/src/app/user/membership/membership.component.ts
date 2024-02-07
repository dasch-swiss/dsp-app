import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Constants, ReadUser, StoredProject } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import {
  AddUserToProjectMembershipAction,
  ProjectsSelectors,
  RemoveUserFromProjectAction,
  UserSelectors,
} from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AutocompleteItem } from '../../workspace/search/operator';

@Component({
  selector: 'app-membership',
  template: `
    <dasch-swiss-app-progress-indicator *ngIf="isMembershipLoading$ | async"></dasch-swiss-app-progress-indicator>

    <div *ngIf="(isMembershipLoading$ | async) === false">
      <div class="mat-headline-6 mb-2">
        This user is member of {{ (user$ | async)?.projects.length | i18nPlural: itemPluralMapping['project'] }}
      </div>

      <!-- list of projects where the user is member of -->
      <div *ngFor="let project of (user$ | async)?.projects; trackBy: trackByFn" class="align-center">
        <div class="flex-1">
          <div>{{ project.longname }} ({{ project.shortname }})</div>
          <div *ngIf="userIsProjectAdmin((user$ | async)?.permissions, project.id)">
            User is <strong>Project admin</strong>
          </div>
        </div>

        <button
          mat-icon-button
          color="warn"
          (click)="removeFromProject(project.id)"
          aria-label="Button to remove user from project"
          matTooltip="Remove user from project"
          matTooltipPosition="above">
          <mat-icon>delete_outline</mat-icon>
        </button>
      </div>

      <mat-divider class="my-2"></mat-divider>

      <div class="d-flex">
        <mat-form-field class="flex-1 mr-2">
          <mat-select placeholder="Add user to project" [(value)]="selectedValue">
            <mat-option *ngFor="let project of projects$ | async; trackBy: trackByFn" [value]="project?.iri">
              {{ project?.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <button
          mat-icon-button
          color="primary"
          (click)="addToProject(selectedValue)"
          [disabled]="selectedValue === null"
          aria-label="Button to add user to project"
          matTooltip="Add user to selected project"
          matTooltipPosition="above">
          <mat-icon>add</mat-icon>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./membership.component.scss'],
})
export class MembershipComponent implements OnDestroy {
  private ngUnsubscribe = new Subject<void>();

  selectedValue: string | null = null;

  @Input() user: ReadUser;
  @Output() closeDialog = new EventEmitter<any>();

  user$ = this._store.select(UserSelectors.allUsers).pipe(
    takeUntil(this.ngUnsubscribe),
    map(users => users.find(u => u.id === this.user.id))
  );

  projects$ = combineLatest([this._store.select(ProjectsSelectors.allProjects), this.user$]).pipe(
    takeUntil(this.ngUnsubscribe),
    map(([projects, user]) => this.getProjects(projects, user))
  );

  readonly itemPluralMapping = {
    project: {
      '=1': '1 project',
      other: '# projects',
    },
  };

  @Select(ProjectsSelectors.isMembershipLoading) isMembershipLoading$: Observable<boolean>;

  constructor(private _store: Store) {}

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  removeFromProject(iri: string) {
    this._store.dispatch(new RemoveUserFromProjectAction(this.user.id, iri));
    this.selectedValue = null;
  }

  addToProject(iri: string) {
    this._store.dispatch(new AddUserToProjectMembershipAction(this.user.id, iri));
  }

  trackByFn = (index: number, item: StoredProject) => `${index}-${item?.id}`;

  userIsProjectAdmin(permissions: PermissionsData, iri: string): boolean {
    return permissions.groupsPerProject[iri].indexOf(Constants.ProjectAdminGroupIRI) > -1;
  }

  private getProjects(projects: StoredProject[], user: ReadUser): AutocompleteItem[] {
    return projects
      .filter(
        p =>
          p.id !== Constants.SystemProjectIRI &&
          p.id !== Constants.DefaultSharedOntologyIRI &&
          p.status === true &&
          user.projects.findIndex(i => i.id === p.id) === -1
      )
      .map(
        p =>
          <AutocompleteItem>{
            iri: p.id,
            name: `${p.longname} (${p.shortname})`,
          }
      )
      .sort((u1: AutocompleteItem, u2: AutocompleteItem) => {
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
