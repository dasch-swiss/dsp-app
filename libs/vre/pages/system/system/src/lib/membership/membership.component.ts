import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Constants, ReadUser, StoredProject } from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import {
  AddUserToProjectMembershipAction,
  LoadProjectsAction,
  ProjectsSelectors,
  RemoveUserFromProjectAction,
  UserSelectors,
} from '@dasch-swiss/vre/core/state';
import { AutocompleteItem } from '@dasch-swiss/vre/pages/user-settings/user';
import { Store } from '@ngxs/store';
import { combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-membership',
  template: `
    @if (isMembershipLoading$ | async) {
      <app-progress-indicator />
    } @else {
      <div class="mat-headline-6 mb-2">
        This user is member of {{ (user$ | async)?.projects.length | i18nPlural: itemPluralMapping['project'] }}
      </div>

      <div *ngFor="let project of (user$ | async)?.projects; trackBy: trackByFn" class="align-center">
        <div class="flex-1">
          <div>{{ project.longname }} ({{ project.shortname }})</div>
          <div>
            @if (isUserProjectAdmin((user$ | async)?.permissions, project.id)) {
              User is <strong>Project admin</strong>
            }
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
    }
  `,
  styleUrls: ['./membership.component.scss'],
})
export class MembershipComponent implements AfterViewInit, OnDestroy {
  private _ngUnsubscribe = new Subject<void>();

  selectedValue: string | null = null;

  @Input({ required: true }) user!: ReadUser;
  @Output() closeDialog = new EventEmitter<any>();

  user$ = this._store.select(UserSelectors.allUsers).pipe(
    takeUntil(this._ngUnsubscribe),
    map(users => users.find(u => u.id === this.user.id))
  );

  projects$ = combineLatest([this._store.select(ProjectsSelectors.allProjects), this.user$]).pipe(
    takeUntil(this._ngUnsubscribe),
    map(([projects, user]) => this._getProjects(projects, user))
  );

  readonly itemPluralMapping = {
    project: {
      '=1': '1 project',
      other: '# projects',
    },
  };

  isMembershipLoading$ = this._store.select(ProjectsSelectors.isMembershipLoading);

  constructor(private _store: Store) {}

  ngAfterViewInit() {
    this._store.dispatch(new LoadProjectsAction());
  }

  ngOnDestroy() {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  removeFromProject(iri: string) {
    this._store.dispatch(new RemoveUserFromProjectAction(this.user.id, iri));
    this.selectedValue = null;
  }

  addToProject(iri: string) {
    this._store.dispatch(new AddUserToProjectMembershipAction(this.user.id, iri));
  }

  trackByFn = (index: number, item: StoredProject) => `${index}-${item?.id}`;

  isUserProjectAdmin(permissions: PermissionsData, projectIri: string): boolean {
    if (!permissions.groupsPerProject) return false;

    return permissions.groupsPerProject[projectIri].includes(Constants.ProjectAdminGroupIRI);
  }

  private _getProjects(projects: StoredProject[], user: ReadUser): AutocompleteItem[] {
    return projects
      .filter(
        p =>
          p.status &&
          p.id !== Constants.SystemProjectIRI &&
          p.id !== Constants.DefaultSharedOntologyIRI &&
          user.projects.every(userProject => userProject.id !== p.id)
      )
      .map(p => ({
        iri: p.id,
        name: `${p.longname} (${p.shortname})`,
      }))
      .sort((a: AutocompleteItem, b: AutocompleteItem) => a.name.localeCompare(b.name));
  }
}
