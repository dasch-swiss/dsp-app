import { Component } from '@angular/core';
import { CenteredBoxComponent } from './centered-box.component';
import { NoResultsFoundComponent } from './no-results-found.component';

@Component({
  selector: 'app-no-results-found-page',
  template: `
    <app-centered-box>
      <app-no-results-found [message]="'The requested page is not found.'" />
    </app-centered-box>
  `,
  imports: [NoResultsFoundComponent, CenteredBoxComponent],
})
export class NoResultsFoundPageComponent {}
