import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Constants, StoredProject } from '@dasch-swiss/dsp-js';
import {
  AdminUsersApiService,
  PermissionsDataADM,
  Project,
  UserDto,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AllProjectsService, AutocompleteItem } from '@dasch-swiss/vre/pages/user-settings/user';
import { BehaviorSubject, combineLatest, map, Observable, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-membership',
  template: `
    <ng-container *ngIf="user$ | async as user">
      <div class="mat-headline-6 mb-2">
        This user is member of {{ ((userProjects$ | async) || []).length | i18nPlural: itemPluralMapping['project'] }}
      </div>

      <div *ngFor="let project of user.projects || []" class="align-center">
        <div class="flex-1">
          <div style="max-width: 500px">{{ project.longname }} ({{ project.shortname }})</div>
          <div>
            @if (isUserProjectAdmin(user.permissions, project)) {
              User is <strong>Project admin</strong>
            }
          </div>
        </div>

        <button
          mat-icon-button
          color="warn"
          (click)="removeFromProject(project)"
          aria-label="Button to remove user from project"
          matTooltip="Remove user from project"
          matTooltipPosition="above">
          <mat-icon>delete_outline</mat-icon>
        </button>
      </div>

      <mat-divider class="my-2" />

      <div class="d-flex">
        <mat-form-field class="flex-1 mr-2">
          <mat-select placeholder="Add user to project" [(value)]="selectedValue">
            <mat-option *ngFor="let project of projects$ | async" [value]="project?.iri">
              {{ project?.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <button
          mat-icon-button
          color="primary"
          (click)="addToProject(selectedValue!)"
          [disabled]="selectedValue === null"
          aria-label="Button to add user to project"
          matTooltip="Add user to selected project"
          matTooltipPosition="above">
          <mat-icon>add</mat-icon>
        </button>
      </div>
    </ng-container>
  `,
  styleUrls: ['./membership.component.scss'],
})
export class MembershipComponent implements OnDestroy, OnChanges {
  @Input({ required: true }) userId!: string;
  @Output() closeDialog = new EventEmitter<void>();

  private _ngUnsubscribe = new Subject<void>();
  selectedValue: string | null = null;

  user$!: Observable<UserDto>;
  userProjects$!: Observable<Project[]>;
  private _refreshSubject = new BehaviorSubject<null>(null);

  projects$!: Observable<AutocompleteItem[]>;

  readonly itemPluralMapping = {
    project: {
      '=1': '1 project',
      other: '# projects',
    },
  };

  constructor(
    private _allProjectsService: AllProjectsService,
    private _adminUsersApi: AdminUsersApiService
  ) {}

  ngOnChanges() {
    this.user$ = this._refreshSubject.pipe(
      switchMap(() => this._adminUsersApi.getAdminUsersIriUseriri(this.userId)),
      map(response => response.user)
    );
    this.projects$ = combineLatest([this._allProjectsService.allProjects$, this.user$]).pipe(
      map(([projects, user]) => this._getProjects(projects, user)),
      takeUntil(this._ngUnsubscribe)
    );
  }

  ngOnDestroy() {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  removeFromProject(project: Project) {
    this._adminUsersApi
      .deleteAdminUsersIriUseririProjectMembershipsProjectiri(this.userId, project.id as unknown as string)
      .subscribe(() => {
        this._refreshUserProjects();
      });
  }

  addToProject(projectIri: string) {
    this._adminUsersApi.postAdminUsersIriUseririProjectMembershipsProjectiri(this.userId, projectIri).subscribe(() => {
      this._refreshUserProjects();
    });
  }

  isUserProjectAdmin(permissions: PermissionsDataADM, project: Project): boolean {
    const projectIri = project.id as unknown as string;

    if (!permissions.groupsPerProject) return false;

    return permissions.groupsPerProject[projectIri].includes(Constants.ProjectAdminGroupIRI);
  }

  private _refreshUserProjects() {
    this._refreshSubject.next(null);
  }

  private _getProjects(projects: StoredProject[], user: UserDto): AutocompleteItem[] {
    return projects
      .filter(
        p =>
          p.status &&
          p.id !== Constants.SystemProjectIRI &&
          p.id !== Constants.DefaultSharedOntologyIRI &&
          user.projects!.every(userProject => (userProject.id as unknown as string) !== p.id)
      )
      .map(p => ({
        iri: p.id,
        name: `${p.longname} (${p.shortname})`,
      }))
      .sort((a: AutocompleteItem, b: AutocompleteItem) => a.name.localeCompare(b.name));
  }
}
