import { AsyncPipe, I18nPluralPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { Constants, StoredProject } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService, PermissionsDataADM, Project, UserDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { BehaviorSubject, combineLatest, map, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { AutocompleteItem } from '../autocomplete-item.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-membership',
  template: `
    @if (user$ | async; as user) {
      <div class="mat-headline-6 mb-2">
        This user is member of {{ ((userProjects$ | async) || []).length | i18nPlural: itemPluralMapping['project'] }}
      </div>
      @for (project of user.projects || []; track project) {
        <div class="align-center">
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
      }
      <mat-divider class="my-2" />
      <div class="d-flex">
        <mat-form-field class="flex-1 mr-2">
          <mat-select placeholder="Add user to project" [(value)]="selectedValue">
            @for (project of projects$ | async; track project) {
              <mat-option [value]="project?.iri">
                {{ project?.name }}
              </mat-option>
            }
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
    }
  `,
  styleUrls: ['./membership.component.scss'],
  imports: [
    AsyncPipe,
    FormsModule,
    I18nPluralPipe,
    MatDivider,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatOption,
    MatSelect,
    MatTooltip,
  ],
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
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _allProjectsService: AllProjectsService
  ) {}

  ngOnChanges() {
    this.user$ = this._refreshSubject.pipe(
      switchMap(() => this._adminApiService.getAdminUsersIriUseriri(this.userId)),
      map(response => response.user)
    );

    this.userProjects$ = this.user$.pipe(map(user => user.projects || []));

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
    this._adminApiService
      .deleteAdminUsersIriUseririProjectMembershipsProjectiri(this.userId, project.id as unknown as string)
      .subscribe(() => {
        this._refreshUserProjects();
      });
  }

  addToProject(projectIri: string) {
    this._adminApiService
      .postAdminUsersIriUseririProjectMembershipsProjectiri(this.userId, projectIri)
      .subscribe(() => {
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
