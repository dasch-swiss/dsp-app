import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-no-results-found',
  template: `
    <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: #9e9e9e">search_off</mat-icon>
    <h2 style="font-weight: 400">No results found</h2>
    <p style="margin: 16px 0 24px; color: #757575; max-width: 400px">{{ message }}</p>
  `,
  standalone: false,
})
export class NoResultsFoundComponent {
  @Input({ required: true }) message!: string;
}
