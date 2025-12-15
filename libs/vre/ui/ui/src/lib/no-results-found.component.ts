import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CenteredMessageComponent } from './centered-message.component';

@Component({
  selector: 'app-no-results-found',
  template: `
    <app-centered-message
      [icon]="'search_off'"
      [title]="'pages.search.noResultsFound' | translate"
      [message]="message" />
  `,
  imports: [TranslatePipe, CenteredMessageComponent],
})
export class NoResultsFoundComponent {
  @Input({ required: true }) message!: string;
}
