import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CenteredBoxComponent } from './centered-box.component';
import { CenteredMessageComponent } from './centered-message.component';

@Component({
  selector: 'app-not-allowed-page',
  template: `
    <app-centered-box>
      <app-centered-message
        [icon]="'block'"
        [title]="'pages.notAllowed.title' | translate"
        [message]="'pages.notAllowed.message' | translate" />
    </app-centered-box>
  `,
  imports: [CenteredBoxComponent, CenteredMessageComponent, TranslatePipe],
})
export class NotAllowedPageComponent {}
