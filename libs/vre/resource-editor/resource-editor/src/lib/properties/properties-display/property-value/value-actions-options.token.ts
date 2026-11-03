import { inject, InjectionToken } from '@angular/core';
import { UserService } from '@dasch-swiss/vre/core/session';
import { Observable } from 'rxjs';

/** How a value's hover actions present themselves, for hosts denser than the resource viewer. Defaults are the viewer's. */
export interface ValueActionsOptions {
  /** Whether a value the user cannot edit offers an info button with who created it and when. */
  showInfo$: Observable<boolean>;
  /** Whether the Edit button's tooltip also says who created the value and when. */
  creationInfoInEditTooltip: boolean;
}

export const VALUE_ACTIONS_OPTIONS = new InjectionToken<ValueActionsOptions>('VALUE_ACTIONS_OPTIONS', {
  factory: () => ({ showInfo$: inject(UserService).isLoggedIn$, creationInfoInEditTooltip: true }),
});
