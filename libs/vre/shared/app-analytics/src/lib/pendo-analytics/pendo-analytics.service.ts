import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DspInstrumentationConfig, DspInstrumentationToken } from '@dasch-swiss/vre/shared/app-config';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';

@Injectable({
  providedIn: 'root',
})
export class PendoAnalyticsService {
  private config: DspInstrumentationConfig = inject(DspInstrumentationToken);
  private authService: AuthService = inject(AuthService);
  private environment: string = this.config.environment;

  constructor() {
    this.authService.isLoggedIn$.pipe(takeUntilDestroyed()).subscribe((isLoggedIn: boolean) => {
      if (isLoggedIn) {
        this.setActiveUser(this.authService.tokenUser);
      } else {
        this.removeActiveUser();
      }
    });
  }

  /**
   * set active user
   */
  setActiveUser(id: string): void {
    console.log('setActiveUser', id);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pendo.initialize({
      visitor: {
        id: id, // Required if user is logged in, default creates anonymous ID
        environment: this.environment,
        // email:        // Recommended if using Pendo Feedback, or NPS Email
        // full_name:    // Recommended if using Pendo Feedback
        // role:         // Optional

        // You can add any additional visitor level key-values here,
        // as long as it's not one of the above reserved names.
      },

      account: {
        id: id, // Required if using Pendo Feedback, default uses the value 'ACCOUNT-UNIQUE-ID'
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
    console.log('removeActiveUser');
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
