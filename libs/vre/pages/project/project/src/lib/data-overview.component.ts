import { Component } from '@angular/core';
import { CenteredBoxComponent } from '@dasch-swiss/vre/ui/ui';
import { ProjectShortDescriptionComponent } from './description/project-short-description.component';

@Component({
  selector: 'app-data-overview',
  template: ` <app-centered-box>
    <app-project-short-description
      style="display: block; width: 760px; max-width: 95vw; border: 1px solid #ebebeb; margin-top: 40px; padding-bottom: 16px" />
  </app-centered-box>`,
  imports: [CenteredBoxComponent, ProjectShortDescriptionComponent],
})
export class DataOverviewComponent {}
