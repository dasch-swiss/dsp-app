import { Component } from '@angular/core';
import { CenteredMessageComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-placeholder-representation',
  template: `
    <app-centered-message
      icon="image_not_supported"
      [title]="'resourceEditor.representations.placeholder.title' | translate"
      [message]="'resourceEditor.representations.placeholder.message' | translate"
      color="white" />
  `,
  imports: [CenteredMessageComponent, TranslatePipe],
})
export class PlaceholderRepresentationComponent {}
