import { Component } from '@angular/core';
import { CenteredMessageComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-representation-placeholder',
  imports: [CenteredMessageComponent, TranslatePipe],
  template: ` <app-centered-message
    [icon]="'hourglass_empty'"
    [title]="'resourceEditor.representations.placeholder.title' | translate"
    [message]="'resourceEditor.representations.placeholder.message' | translate"
    [color]="'white'"
    style="padding: 48px" />`,
  styles: [
    `
      :host {
        display: block;
        background: #ff2222;
        border-radius: 16px;
      }
    `,
  ],
})
export class RepresentationPlaceholderComponent {}
