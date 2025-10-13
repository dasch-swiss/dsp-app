import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-no-results-found',
  template: ` <app-centered-message [icon]="'search_off'" [title]="'No results found'" [message]="message" /> `,
  standalone: false,
})
export class NoResultsFoundComponent {
  @Input({ required: true }) message!: string;
}
