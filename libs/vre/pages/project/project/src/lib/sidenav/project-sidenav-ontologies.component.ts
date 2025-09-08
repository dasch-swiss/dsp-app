import { Component } from '@angular/core';
import { ProjectPageService } from '../project-page.service';

@Component({
  selector: 'app-projects-sidenav-ontologies',
  template: `
    @for (onto of projectOntologies$ | async; track onto; let first = $first) {
      <mat-accordion [displayMode]="'flat'">
        <mat-expansion-panel [expanded]="first">
          <mat-expansion-panel-header>
            <div class="sidenav-panel-header">
              <mat-panel-title class="mat-subtitle-1">
                <p
                  #ontoTitle
                  matTooltip="{{ onto.label }}"
                  matTooltipShowDelay="500"
                  matTooltipPosition="right"
                  [matTooltipDisabled]="compareElementHeights(ontoTitle)">
                  {{ onto.label }}
                </p>
              </mat-panel-title>
            </div>
          </mat-expansion-panel-header>
          <!-- list of ontology classes -->
          <app-resource-class-sidenav [ontology]="onto" />
        </mat-expansion-panel>
        <mat-divider />
      </mat-accordion>
    }
  `,
  styleUrls: ['./project-sidenav-ontologies.component.scss'],
})
export class ProjectSidenavOntologiesComponent {
  projectOntologies$ = this._projectPageService.ontologies$;

  constructor(private _projectPageService: ProjectPageService) {}

  compareElementHeights(elem: HTMLElement): boolean {
    return !(elem.scrollHeight > elem.clientHeight);
  }
}
