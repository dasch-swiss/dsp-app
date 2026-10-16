import { AsyncPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { APIV3ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { catchError, combineLatest, first, map, of, shareReplay, switchMap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { ResourceClassSidenavComponent } from './resource-class-sidenav/resource-class-sidenav.component';

@Component({
  selector: 'app-projects-sidenav-ontologies',
  imports: [AsyncPipe, MatIcon, ResourceClassSidenavComponent, AppProgressIndicatorComponent],
  template: `
    @if (projectOntologies$ | async; as projectOntologies) {
      @if (projectOntologies.length === 0) {
        <div class="mat-body-2 empty-message">This project does not have any data yet.</div>
      } @else {
        <!-- One collapsible group per data model: a small label with its chevron, then its classes
             flush with the edge (DEV-7494, sidebar design I2). -->
        @for (onto of projectOntologies; let first = $first; track onto.ontology.iri) {
          @let expanded = isExpanded(onto.ontology.iri, projectOntologies.length === 1 && first);
          <div class="ontology-group" data-cy="sidenav-ontology">
            <button
              type="button"
              class="ontology-header"
              [attr.aria-expanded]="expanded"
              [title]="onto.ontology.label"
              (click)="toggle(onto.ontology.iri, expanded)">
              <span class="ontology-label">{{ onto.ontology.label }}</span>
              <mat-icon class="ontology-chevron">{{ expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
            </button>
            @if (expanded) {
              <app-resource-class-sidenav [ontology]="onto" />
            }
          </div>
        }
      }
    } @else {
      <app-progress-indicator />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        /* Breathing room above the first group, as the class header has above its title. */
        padding-top: 8px;
      }

      .empty-message {
        margin-top: 48px;
        text-align: center;
      }

      .ontology-group {
        padding-bottom: 8px;
      }

      .ontology-header {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
        height: 36px;
        padding: 0 12px 0 16px;
        border: 0;
        background: transparent;
        cursor: pointer;
        text-align: left;
        font: 500 12px/1 var(--font-sans, Roboto, sans-serif);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #6b7280;

        &:hover {
          color: #374151;
        }

        &:focus-visible {
          outline: 2px solid var(--primary, #336790);
          outline-offset: -2px;
        }
      }

      .ontology-label {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ontology-chevron {
        flex: none;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class ProjectSidenavOntologiesComponent implements OnInit {
  private readonly _projectOntologies$ = this._projectPageService.currentProject$.pipe(
    switchMap(project =>
      this._v3.getV3ProjectsProjectiriResourcesperontology(project.id).pipe(
        catchError(error => {
          console.error('Error loading project ontologies:', error);
          return of([]);
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  projectOntologies$ = combineLatest([this._projectOntologies$, this._localizationService.currentLanguage$]).pipe(
    map(([ontologies, lang]) =>
      [...ontologies].sort((a, b) => SortingHelper.compareStringsByLanguage(a.ontology.label, b.ontology.label, lang))
    )
  );
  initialExpandIri?: string;

  constructor(
    private readonly _projectPageService: ProjectPageService,
    private readonly _route: ActivatedRoute,
    private readonly _ontologyService: OntologyService,
    private readonly _v3: APIV3ApiService,
    private readonly _localizationService: LocalizationService
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

  /** Groups the user has opened or closed, overriding the initial state below. */
  private readonly _toggled = signal<ReadonlyMap<string, boolean>>(new Map());

  /** Open if the user opened it; otherwise the ontology of the class in the URL, else `fallback`. */
  isExpanded(ontologyId: string, fallback: boolean): boolean {
    const toggled = this._toggled().get(ontologyId);
    if (toggled !== undefined) {
      return toggled;
    }
    if (this.initialExpandIri) {
      return this.initialExpandIri === ontologyId;
    }
    return fallback;
  }

  toggle(ontologyId: string, expanded: boolean): void {
    this._toggled.update(current => new Map(current).set(ontologyId, !expanded));
  }
}
