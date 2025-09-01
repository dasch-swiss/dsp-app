import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-project-sidenav-collapse-button',
  template: ` <button
    mat-icon-button
    disableRipple="true"
    color="primary"
    data-cy="side-panel-collapse-btn"
    class="collapse-btn"
    (click)="toggleSidenav.emit()"
    [matTooltip]="expand ? 'expand' : 'collapse'"
    matTooltipPosition="right">
    <mat-icon>{{ expand ? 'chevron_right' : 'chevron_left' }}</mat-icon>
  </button>`,
  styles: [
    `
      .collapse-btn {
        background-color: white;
        position: relative;
        z-index: 1;
        border: 1px solid #336790;
        width: 23px;
        height: 23px;
        padding: 0;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          position: relative;
          line-height: 18px;
          top: -2px;
        }
      }
    `,
  ],
})
export class ProjectSidenavCollapseButtonComponent {
  @Input({ required: true }) expand!: boolean;
  @Output() toggleSidenav = new EventEmitter<void>();
}
