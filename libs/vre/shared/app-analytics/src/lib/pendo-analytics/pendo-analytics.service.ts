import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DspInstrumentationConfig, DspInstrumentationToken } from '@dasch-swiss/vre/shared/app-config';
import { AccessTokenService, AuthService } from '@dasch-swiss/vre/shared/app-session';

@Injectable({
  providedIn: 'root',
})
export class PendoAnalyticsService {
  private config: DspInstrumentationConfig = inject(DspInstrumentationToken);
  private authService: AuthService = inject(AuthService);
  private _accessTokenService: AccessTokenService = inject(AccessTokenService);
  private environment: string = this.config.environment;

  setup() {
    this.authService
      .isCredentialsValid$()
      .pipe(takeUntilDestroyed())
      .subscribe((isSessionValid: boolean) => {
        if (!isSessionValid) {
          this.removeActiveUser();
          return;
        }
        const token = this._accessTokenService.getTokenUser();
        if (!token) return;

        this.setActiveUser(token);
      });
  }

  /**
   * set active user
   */
  setActiveUser(id: string): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pendo.initialize({
      visitor: {
        id, // Required if user is logged in, default creates anonymous ID
        environment: this.environment,
        // email:        // Recommended if using Pendo Feedback, or NPS Email
        // full_name:    // Recommended if using Pendo Feedback
        // role:         // Optional

        // You can add any additional visitor level key-values here,
        // as long as it's not one of the above reserved names.
      },

      account: {
        id, // Required if using Pendo Feedback, default uses the value 'ACCOUNT-UNIQUE-ID'
        environment: this.environment,
        // name:         // Optional
        // is_paying:    // Recommended if using Pendo Feedback
        // monthly_value:// Recommended if using Pendo Feedback
        // planLevel:    // Optional
        // planPrice:    // Optional
        // creationDate: // Optional

        // You can add any additional account level key-values here,
        // as long as it's not one of the above reserved names.
      },
    });
  }

  /**
   * remove active user
   */
  removeActiveUser(): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pendo.initialize({
      visitor: {
        id: 'VISITOR-UNIQUE-ID',
        environment: this.environment,
      },
      account: {
        id: 'ACCOUNT-UNIQUE-ID',
        environment: this.environment,
      },
    });
  }
}
