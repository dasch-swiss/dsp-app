import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { KnoraApiConnection, ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken, DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { CreateUserDialogComponent } from '@dasch-swiss/vre/pages/system/system';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslatePipe } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { CollaborationPageService } from '../collaboration-page.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-user',
  template: `
    <h3>{{ 'pages.project.addUser.title' | translate }}</h3>
    <div style="display: flex; gap: 8px; align-items: center">
      <mat-form-field style="flex: 1">
        <mat-label>{{ 'pages.project.addUser.select' | translate }}</mat-label>
        <input matInput [matAutocomplete]="user" [formControl]="usernameControl" />

        <mat-autocomplete
          #user="matAutocomplete"
          [displayWith]="displayUser"
          (optionSelected)="onUserSelected($event.option.value)">
          @if (loading) {
            <mat-option [disabled]="true">
              <app-progress-indicator />
            </mat-option>
          }
          @if (!loading && (filteredUsers$ | async); as filteredUsers) {
            @for (user of filteredUsers; track user) {
              <mat-option [value]="user.id" [disabled]="isMember(user)">
                {{ getLabel(user) }}
              </mat-option>
            }
            @if (filteredUsers.length === 0) {
              <mat-option [disabled]="true">{{ 'pages.project.addUser.noResults' | translate }}</mat-option>
            }
          }
        </mat-autocomplete>
      </mat-form-field>

      <button mat-raised-button color="primary" class="add-new create-user-btn" (click)="createUser()">
        {{ 'pages.project.addUser.newUser' | translate }}
      </button>
    </div>
  `,
  styleUrls: ['./add-user.component.scss'],
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    MatButton,
    TranslatePipe,
    AppProgressIndicatorComponent,
  ],
})
export class AddUserComponent {
  @Input({ required: true }) projectUuid!: string;

  get projectIri(): string {
    return this._projectService.uuidToIri(this.projectUuid);
  }

  usernameControl = new FormControl<string | null>(null);
  users: ReadUser[] = [];

  loading = false;
  reloadListSubject = new BehaviorSubject(null);

  filteredUsers$ = combineLatest([
    this.usernameControl.valueChanges.pipe(startWith(null)),
    this.reloadListSubject.pipe(
      switchMap(() => this.collaborationPageService.reloadProjectMembers$),
      tap(() => {
        this.loading = true;
      }),
      switchMap(() => this._userApiService.list()),
      tap(() => {
        this.loading = false;
        this._cdr.detectChanges();
      }),
      map(response => {
        this.users = response.users;
        return response.users;
      }),
      shareReplay(1)
    ),
  ]).pipe(map(([filterVal, users_]) => (filterVal ? this._filter(users_, filterVal) : users_)));

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _dialog: MatDialog,
    private readonly _projectService: ProjectService,
    private readonly _userApiService: UserApiService,
    public readonly collaborationPageService: CollaborationPageService
  ) {}

  getLabel(user: ReadUser): string {
    const usernameLabel = user.username ? `${user.username} | ` : '';
    const emailLabel = user.email ? `${user.email} | ` : '';
    return `${usernameLabel}${emailLabel}${user.givenName} ${user.familyName}`;
  }

  displayUser = (userId: string): string => {
    const user = this.users.find(u => u.id === userId);
    return user ? this.getLabel(user) : '';
  };

  isMember(user: ReadUser): boolean {
    return user.projects
      ? user.projects.map(project => project.id as unknown as string).includes(this.projectIri)
      : false;
  }

  onUserSelected(userId: string) {
    // Clear the input immediately to prevent the user ID from being displayed
    this.usernameControl.setValue(null, { emitEvent: false });
    this.addUser(userId);
  }

  addUser(userId: string) {
    this._dspApiConnection.admin.usersEndpoint.addUserToProjectMembership(userId, this.projectIri).subscribe(() => {
      this.collaborationPageService.reloadProjectMembers();
      this.reloadListSubject.next(null);
    });
  }

  createUser() {
    this._dialog
      .open<CreateUserDialogComponent, undefined, string>(
        CreateUserDialogComponent,
        DspDialogConfig.dialogDrawerConfig(undefined, true)
      )
      .afterClosed()
      .pipe(
        filter(result => result !== undefined),
        switchMap(userId =>
          this._adminApiService.postAdminUsersIriUseririProjectMembershipsProjectiri(userId!, this.projectIri)
        )
      )
      .subscribe(() => {
        this.collaborationPageService.reloadProjectMembers();
      });
  }

  private _filter(list: ReadUser[], filterVal: string) {
    return list.filter(user => `${user.givenName} ${user.familyName}`.toLowerCase().includes(filterVal.toLowerCase()));
  }
}
