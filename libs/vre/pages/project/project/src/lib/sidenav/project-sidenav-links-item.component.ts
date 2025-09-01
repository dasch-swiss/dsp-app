import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-projects-sidenav-links-item',
  template: `
    <a mat-list-item class="section-title" [routerLink]="link" style="cursor: pointer" [ngClass]="{ active: active }">
      <span matListItemTitle class="section-label">
        <mat-icon class="sidenav-prefix-icon">{{ icon }}</mat-icon>
        <p>{{ label }}</p>
      </span>
    </a>
  `,
  styleUrls: ['./project-sidenav-links-item.component.scss'],
})
export class ProjectSidenavLinksItemComponent {
  @Input({ required: true }) link!: string[];
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) active!: boolean;
}
