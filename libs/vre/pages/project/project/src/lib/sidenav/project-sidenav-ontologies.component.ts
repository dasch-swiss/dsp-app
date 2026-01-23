import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { APIV3ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { catchError, combineLatest, first, of, shareReplay, switchMap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { ResourceClassSidenavComponent } from './resource-class-sidenav/resource-class-sidenav.component';

@Component({
  selector: 'app-projects-sidenav-ontologies',
  imports: [
    AsyncPipe,
    MatExpansionModule,
    MatTooltipModule,
    ResourceClassSidenavComponent,
    AppProgressIndicatorComponent,
  ],
  template: `
    @if (projectOntologies$ | async; as projectOntologies) {
      @if (projectOntologies.length === 0) {
        <div class="mat-body-2 empty-message">This project does not have any data yet.</div>
      } @else {
        <mat-accordion>
          @for (onto of projectOntologies; let first = $first; track onto) {
            <mat-expansion-panel
              class="ontology-panel"
              [togglePosition]="'before'"
              data-cy="sidenav-ontology"
              [expanded]="shouldExpand(onto.ontology.iri, projectOntologies.length === 1 && first)">
              <mat-expansion-panel-header>
                <mat-panel-title
                  #ontoTitle
                  matTooltip="{{ onto.ontology.label }}"
                  matTooltipShowDelay="500"
                  matTooltipPosition="right"
                  [matTooltipDisabled]="compareElementHeights(ontoTitle)">
                  {{ onto.ontology.label }}
                </mat-panel-title>
              </mat-expansion-panel-header>
              <app-resource-class-sidenav class="resource-class-sidenav" [ontology]="onto" />
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
      .mat-expansion-panel-body {
        padding: 0;
      }

      .empty-message {
        margin-top: 48px;
        text-align: center;
      }

      .ontology-panel {
        box-shadow: none;
      }

      .resource-class-sidenav {
        display: block;
        margin-left: 40px;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectSidenavOntologiesComponent implements OnInit {
  projectOntologies$ = this._projectPageService.currentProject$.pipe(
    switchMap(project => this._v3.getV3ProjectsProjectiriResourcesperontology(project.id)),
    shareReplay({ bufferSize: 1, refCount: true }),
    catchError(error => {
      console.error('Error loading project ontologies:', error);
      return of([]);
    })
  );
  initialExpandIri?: string;

  constructor(
    private readonly _projectPageService: ProjectPageService,
    private readonly _route: ActivatedRoute,
    private readonly _ontologyService: OntologyService,
    private readonly _v3: APIV3ApiService
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
