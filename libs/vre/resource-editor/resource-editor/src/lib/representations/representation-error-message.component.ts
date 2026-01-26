import { Component } from '@angular/core';
import { NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-representation-error-message',
  imports: [NoResultsFoundComponent, TranslatePipe],
  template: ` <app-no-results-found
    [message]="'shared.status.resourceNotLoaded' | translate"
    style="display: block; padding: 16px" />`,
})
export class RepresentationErrorMessageComponent {}
