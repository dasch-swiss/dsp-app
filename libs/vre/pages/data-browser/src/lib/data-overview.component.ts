import { Component } from '@angular/core';

@Component({
  selector: 'app-data-overview',
  template: ` <app-centered-box>
    <app-project-short-description
      style="display: block; max-width: 600px; border: 1px solid #ebebeb; margin-top: 40px" />
  </app-centered-box>`,
  standalone: false,
})
export class DataOverviewComponent {}
