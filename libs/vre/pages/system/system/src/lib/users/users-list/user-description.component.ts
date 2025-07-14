import { Component, Input } from '@angular/core';
import { ReadUser } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-user-description',
  template: ` <span style="display: flex; align-items: center">
    <span style="width: 50px; margin-right: 16px">
      <img appAdminImage [image]="user.email" [type]="'user'" alt="avatar" style="width: 50px;border-radius: 50px;" />
    </span>

    <span>
      <h5 class="mat-subtitle-1" style="margin-bottom: 0">{{ user.givenName }} {{ user.familyName }}</h5>
      <span class="mat-subtitle-2">{{ user.username }} | {{ user.email }}</span>
    </span>
  </span>`,
})
export class UserDescriptionComponent {
  @Input({ required: true }) user!: ReadUser;
}
