import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UserService } from '@dasch-swiss/vre/core/session';
import { Subject, takeUntil, takeWhile } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  template: `
    @if (user$ | async; as user) {
      <div style="display: flex; flex-direction: row; gap: 24px; padding: 24px; max-width: 600px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <img
            appAdminImage
            [image]="user.email"
            [type]="'user'"
            alt="user profile"
            style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />

          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <h1 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #1a1a1a;">
                {{ user.givenName }} {{ user.familyName }}
              </h1>
              <p style="margin: 0; color: #666">({{ user.username }})</p>
            </div>

            <mat-chip-set>
              <mat-chip [disableRipple]="true">
                <mat-icon matChipAvatar>language</mat-icon>
                {{ user.lang }}
              </mat-chip>
              <mat-chip [disableRipple]="true">
                <mat-icon matChipAvatar style="color: #856404">verified_user</mat-icon>
                {{ 'pages.userSettings.profile.systemAdmin' | translate }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfileComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  isSysAdmin$ = this._userService.isSysAdmin$;
  user$ = this._userService.user$;

  constructor(
    private _userService: UserService,
    private _titleService: Title
  ) {}

  ngOnInit() {
    this.user$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        takeWhile(user => user !== null)
      )
      .subscribe(user => this._titleService.setTitle(`${user.username} (${user.givenName} ${user.familyName})`));
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
