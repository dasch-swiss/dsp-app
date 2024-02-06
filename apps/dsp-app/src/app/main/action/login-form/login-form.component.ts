import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { Subscription } from 'rxjs';
import { finalize, takeLast, tap } from 'rxjs/operators';

@Component({
  selector: 'app-login-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="login()" class="login-form">
      <app-common-input [formGroup]="form" controlName="username" placeholder="Username"></app-common-input>

      <mat-form-field>
        <input
          placeholder="Password"
          autocomplete="current-password"
          formControlName="password"
          matInput
          type="password" />
        <mat-error *ngIf="form.get('password').errors as errors">
          {{ errors | humanReadableError }}
        </mat-error>
      </mat-form-field>

      <button
        [class.mat-primary]="!isLoginError"
        [class.mat-warn]="isLoginError"
        mat-raised-button
        appLoadingButton
        [isLoading]="loading"
        type="submit">
        {{ isLoginError ? ('appLabels.form.action.retry' | translate) : ('appLabels.form.action.login' | translate) }}
      </button>
    </form>
  `,
  styles: [
    `
      .login-form {
        display: flex;
        flex-direction: column;
        padding: 16px;
      }
    `,
  ],
})
export class LoginFormComponent implements OnInit, OnDestroy {
  loading = false;
  form = this._fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  isLoginError: boolean;
  returnUrl: string;

  private subscription: Subscription;

  constructor(
    private _fb: UntypedFormBuilder,
    private router: Router,
    private _authService: AuthService,
    private route: ActivatedRoute,
    private location: Location,
    private _notification: NotificationService
  ) {}

  ngOnInit() {
    this.returnUrl = this.getReturnUrl();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  login() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.isLoginError = false;

    this.subscription = this._authService
      .login$(this.form.get('username').value, this.form.get('password').value)
      .pipe(
        takeLast(1),
        tap({
          error: () => {
            this.isLoginError = true;
          },
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        if (this.returnUrl) {
          this.router.navigate([this.returnUrl]);
        }
      });
  }

  private getReturnUrl(): string {
    const returnUrlParameterName = 'returnUrl';
    const returnUrl = this.route.snapshot.queryParams[returnUrlParameterName];
    this.location.go(this.removeParameterFromUrl(this.location.path(), returnUrlParameterName, returnUrl));
    return returnUrl;
  }

  private removeParameterFromUrl(path: string, parameterName: string, parameterValue: string): string {
    const urlSegments = path.split('?');
    const queryString = urlSegments.pop();
    if (!queryString) {
      return path;
    }
    const params = queryString.split('&');
    const newQuerystring = params
      .filter(item => item !== `${parameterName}=${encodeURIComponent(parameterValue)}`)
      .join('&');

    if (newQuerystring) {
      urlSegments.push(newQuerystring);
    }

    return urlSegments.join('?');
  }
}
