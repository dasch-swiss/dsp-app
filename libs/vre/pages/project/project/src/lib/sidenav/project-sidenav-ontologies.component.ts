import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { combineLatest, first, shareReplay } from 'rxjs';
import { ProjectPageService } from '../project-page.service';

@Component({
  selector: 'app-projects-sidenav-ontologies',
  template: `
    @if (projectOntologies$ | async; as projectOntologies) {
      @if (projectOntologies.length === 0) {
        <div class="mat-body-2" style="margin-top: 48px; text-align: center">
          This project does not have any data yet.
        </div>
      } @else {
        <mat-accordion>
          @for (onto of projectOntologies; let first = $first; track onto) {
            <mat-expansion-panel
              [togglePosition]="'before'"
              style="box-shadow: none"
              data-cy="sidenav-ontology"
              [expanded]="shouldExpand(onto.id, projectOntologies.length === 1 && first)">
              <mat-expansion-panel-header>
                <mat-panel-title
                  #ontoTitle
                  matTooltip="{{ onto.label }}"
                  matTooltipShowDelay="500"
                  matTooltipPosition="right"
                  [matTooltipDisabled]="compareElementHeights(ontoTitle)">
                  {{ onto.label }}
                </mat-panel-title>
              </mat-expansion-panel-header>
              <app-resource-class-sidenav [ontology]="onto" style="display: block; margin-left: 40px" />
            </mat-expansion-panel>
          }
        </mat-accordion>
      }
    } @else {
      <app-progress-indicator />
    }
  `,
  styles: [
    `
      :host ::ng-deep .mat-expansion-panel-body {
        padding: 0;
      }
    `,
  ],
  standalone: false,
})
export class ProjectSidenavOntologiesComponent implements OnInit {
  projectOntologies$ = this._projectPageService.ontologies$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
  initialExpandIri?: string;

  constructor(
    private _projectPageService: ProjectPageService,
    private _route: ActivatedRoute,
    private _ontologyService: OntologyService
  ) {}

  ngOnInit() {
    if (this._route.firstChild) {
      // if there is an ontology class displayed initially, find the ontology class Id and expand the corresponding panel
      combineLatest([this._route.firstChild.params, this._projectPageService.currentProject$])
        .pipe(first())
        .subscribe(([params, project]) => {
          const ontologyLabel = params[RouteConstants.ontologyParameter];
          if (!ontologyLabel) {
            return;
          }
          this.initialExpandIri = this._ontologyService.getOntologyIriFromRoute(project.shortcode, ontologyLabel);
        });
    }
  }

  shouldExpand(ontologyId: string, fallback: boolean) {
    if (this.initialExpandIri) {
      return this.initialExpandIri === ontologyId;
    }
    return fallback;
  }

  compareElementHeights(elem: HTMLElement): boolean {
    return !(elem.scrollHeight > elem.clientHeight);
  }
}
