import { Component, Input } from '@angular/core';
import { ReadUser } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-project-members',
  template: ` @for (user of users; track user) {
    <app-project-members-row [user]="user" />
  }`,
  standalone: false,
})
export class ProjectMembersComponent {
  @Input({ required: true }) users!: ReadUser[];
}
