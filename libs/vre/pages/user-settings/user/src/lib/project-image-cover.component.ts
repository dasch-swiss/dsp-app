import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-project-image-cover',
  template: ` <img
      *ngIf="!imageCantLoad; else backgroundTpl"
      mat-card-image
      [src]="'assets/images/project/width-500/' + project.shortcode + '.webp'"
      alt="image of project"
      (error)="imageCantLoad = true"
      class="img" />

    <ng-template #backgroundTpl>
      <div class="backup-text" [ngClass]="{ small: project.shortname.length > 10 }">
        <span>{{ project.shortname }}</span>
      </div>
    </ng-template>`,
  styles: [
    `
      :host {
        display: block;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.1) 100%);
        }
      }

      .img {
        filter: sepia(0.5);
        width: 100%;
        object-fit: cover;
        height: 200px;
      }

      .backup-text {
        background: #ffecbd;
        color: #bfa153;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        font-weight: bold;
        text-transform: uppercase;

        &.small {
          font-size: 24px;
        }
      }
    `,
  ],
})
export class ProjectImageCoverComponent {
  @Input({ required: true }) project!: { shortcode: string; shortname: string };

  imageCantLoad = false;
}
