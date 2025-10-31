import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dialog-header',
  template: `
    <div class="app-toolbar transparent">
      <div class="app-toolbar-row">
        <h3 class="mat-body subtitle">{{ subtitle }}</h3>
      </div>
      <div class="app-toolbar-row">
        <h2 class="mat-headline-6">{{ title }}</h2>
        <span class="fill-remaining-space"></span>
        <span class="app-toolbar-action"></span>
      </div>
    </div>
  `,
  standalone: true,
})
export class DialogHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
