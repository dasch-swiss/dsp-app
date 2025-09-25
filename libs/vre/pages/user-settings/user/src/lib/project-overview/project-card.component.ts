import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
  selector: 'app-project-card',
  template: `
    <div class="project-card-wrapper" data-cy="project-card">
      <a [routerLink]="[RouteConstants.project, projectUuid]">
        <mat-card class="project-card" appearance="outlined" (keydown.enter)="navigate()">
          <div mat-card-image class="image-container">
            <app-project-image-cover [project]="project" />
          </div>

          <mat-card-content class="project-content">
            <div class="project-details">
              <mat-card-title class="project-title">
                {{ project.longname }}
              </mat-card-title>
              <mat-card-subtitle class="project-subtitle">
                <span>{{ project.shortname }}</span>
                <span>|</span>
                <span>{{ project.shortcode }}</span>
              </mat-card-subtitle>
            </div>
          </mat-card-content>
        </mat-card>
      </a>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .project-card-wrapper {
        position: relative;
        height: 100%;
        min-height: 280px;
      }

      .project-card {
        display: flex;
        border-radius: 8px;
        cursor: pointer;
        color: var(--primary);
        transition:
          background-color 0.2s ease,
          box-shadow 0.2s ease;

        .project-content {
          display: flex;
        }

        .project-details {
          padding-top: 8px;

          .project-title {
            color: black;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin: 0;
          }

          .project-subtitle > span {
            margin-right: 0.5rem;
          }
        }
      }

      .project-card:hover,
      .project-card:focus {
        background-color: white;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        position: absolute;
        z-index: 1;
        width: 100%;

        .project-details .project-title {
          -webkit-line-clamp: unset;
        }
      }

      .image-container {
        width: 100%;
        height: 200px; /* Or any fixed height you want */
        overflow: hidden;
      }
    `,
  ],
  standalone: false,
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: StoredProject;
  @Input({ required: true }) index!: number;

  imageCantLoad = false;

  get projectUuid() {
    return ProjectService.IriToUuid(this.project.id);
  }

  constructor(private _router: Router) {}

  navigate() {
    this._router.navigate([RouteConstants.project, this.projectUuid]);
  }

  protected readonly RouteConstants = RouteConstants;
}
