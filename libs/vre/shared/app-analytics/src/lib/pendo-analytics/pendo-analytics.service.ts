import { inject, Injectable } from '@angular/core';
import { Session, SessionService } from '@dasch-swiss/vre/shared/app-session';
import { v5 as uuidv5 } from 'uuid';
import {
    DspInstrumentationConfig,
    DspInstrumentationToken,
} from '@dasch-swiss/vre/shared/app-config';

@Injectable({
    providedIn: 'root',
})
export class PendoAnalyticsService {
    private config: DspInstrumentationConfig = inject(DspInstrumentationToken);
    private session: SessionService = inject(SessionService);
    private environment: string = this.config.environment;

    constructor() {
        // FIXME: so that updates to the session state are reflected in specified user
        this.session.isSessionValid().subscribe((response: boolean) => {
            if (response) {
                const session: Session | null = this.session.getSession();
                if (session?.user?.name) {
                    const id: string = uuidv5(session.user.name, uuidv5.URL);
                    this.setActiveUser(id);
                } else {
                    this.removeActiveUser();
                }
            }
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
