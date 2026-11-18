import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ActivatedRoute,
  IsActiveMatchOptions,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs';
import { CanDo, injectDataModelEditing } from '../ontology-map/data-model-editor';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { DataModelsRailState } from './data-models-rail-state';

/**
 * The Data models 2 tab: first the Overview, as the Data models tab's page, then, for a data model opened there, one bar
 * on top to go back, pick another data model, edit or delete it, and open a section of it (its classes, its
 * properties, its diagram), the section under it. Controlled vocabularies, opened from the Overview, show with the
 * way back and their title only.
 */
@Component({
  selector: 'app-data-models-rail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataModelsRailState],
  imports: [
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTabLink,
    MatTabNav,
    MatTabNavPanel,
    MatTooltip,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    <div class="page">
      @if (section() !== overview) {
        <header class="bar" data-cy="data-models-rail">
          <!-- Back to every data model and vocabulary of the project. -->
          <a
            mat-icon-button
            class="back"
            data-cy="data-models-rail-back"
            [routerLink]="overview"
            [attr.aria-label]="r + '.backToOverview' | translate"
            [matTooltip]="r + '.backToOverview' | translate">
            <mat-icon>chevron_left</mat-icon>
          </a>

          <!-- Controlled vocabularies say their title themselves; a data model's sections, under its name. -->
          @if (section() !== lists && state.selected(); as selected) {
            <!-- The data model's name, a menu to pick another when there are several. -->
            @if (state.ontologies().length > 1) {
              <button
                type="button"
                class="name picker"
                data-cy="data-models-rail-picker"
                [attr.aria-label]="'pages.ontologyMap.dataModel' | translate"
                [matMenuTriggerFor]="models">
                <b>{{ selected.label }}</b>
                <mat-icon>arrow_drop_down</mat-icon>
              </button>
              <mat-menu #models="matMenu">
                @for (ontology of state.ontologies(); track ontology.iri) {
                  <button mat-menu-item (click)="show(ontology.iri)">{{ ontology.label }}</button>
                }
              </mat-menu>
            } @else {
              <b class="name" data-cy="data-models-rail-picker">{{ selected.label }}</b>
            }

            <!-- For editors: the data model's pen and its bin. -->
            @if (state.canEdit() && editing.canEditDataModels) {
              <button
                mat-icon-button
                type="button"
                class="small"
                data-cy="data-models-rail-edit-model"
                [attr.aria-label]="r + '.editDataModel' | translate"
                [matTooltip]="r + '.editDataModel' | translate"
                (click)="editModel()">
                <mat-icon>edit</mat-icon>
              </button>
              @let check = deleteCheck();
              <!-- Deletes once the API says nothing uses the data model; why not, on hover, otherwise. -->
              <span
                [matTooltip]="
                  (!check ? r + '.checkingDelete' : check.canDo ? r + '.deleteDataModel' : r + '.cannotDeleteDataModel')
                    | translate
                ">
                <button
                  mat-icon-button
                  type="button"
                  class="small delete"
                  data-cy="data-models-rail-delete-model"
                  [attr.aria-label]="r + '.deleteDataModel' | translate"
                  [disabled]="!check?.canDo"
                  (click)="deleteModel(selected.iri, selected.label)">
                  <mat-icon>delete</mat-icon>
                </button>
              </span>
            }

            <span class="divider"></span>

            <!-- The data model's sections, as tabs. -->
            <nav mat-tab-nav-bar class="sections" mat-stretch-tabs="false" [tabPanel]="panel">
              @for (section of modelSections(); track section.path) {
                <a
                  mat-tab-link
                  routerLinkActive
                  #active="routerLinkActive"
                  [routerLinkActiveOptions]="activeOptions"
                  [active]="active.isActive"
                  [routerLink]="section.path"
                  [queryParams]="state.modelParam()"
                  [attr.data-cy]="'data-models-rail-' + section.path">
                  {{ r + '.' + section.path | translate }}
                  @if (section.count !== undefined) {
                    <span class="count">{{ section.count }}</span>
                  }
                </a>
              }
            </nav>
          }
        </header>
      }

      <mat-tab-nav-panel #panel class="content">
        <router-outlet />
      </mat-tab-nav-panel>
    </div>
  `,
  styles: [
    `
      @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

      :host {
        display: block;
        height: 100%;
      }

      .page {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      // Back, the data model's name, its pen and bin, then its sections, on one line.
      .bar {
        flex: none;
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 48px;
        padding: 0 16px 0 8px;
        border-bottom: 1px solid $cool_gray_200;
        background: white;
      }

      .back {
        color: $cool_gray_600;
      }

      .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 15px;
        font-weight: 500;
        color: $cool_gray_900;
      }

      // With several data models, the name opens a menu to pick another; no box around it.
      .picker {
        display: flex;
        align-items: center;
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        cursor: pointer;

        b {
          font-size: 15px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        mat-icon {
          flex: none;
          color: $cool_gray_500;
        }
      }

      .small.mat-mdc-icon-button {
        width: 32px;
        height: 32px;
        padding: 7px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .delete:not([disabled]) {
        color: #b3261e;
      }

      .divider {
        flex: none;
        width: 1px;
        height: 24px;
        margin: 0 8px;
        background: $cool_gray_200;
      }

      // The sections as compact tabs, the bar's border their only line.
      .sections {
        --mat-tab-container-height: 48px;
        border-bottom: 0;

        .mat-mdc-tab-link {
          min-width: 0;
          padding: 0 12px;
        }
      }

      .count {
        margin-left: 6px;
        font-size: 12px;
        font-weight: 400;
        color: $cool_gray_500;
      }

      .content {
        display: block;
        flex: 1;
        min-height: 0;
        background: $cool_gray_50;
      }
    `,
  ],
})
export class DataModelsRailPageComponent {
  readonly state = inject(DataModelsRailState);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  /** A section is current whatever its query: the data model, a filter or an open panel. */
  readonly activeOptions: IsActiveMatchOptions = {
    paths: 'subset',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };

  readonly editing = injectDataModelEditing();
  private readonly _destroyRef = inject(DestroyRef);
  readonly overview = RouteConstants.overview;
  readonly lists = RouteConstants.lists;

  /** The section shown: the Overview, a data model's section, or Controlled vocabularies. */
  readonly section = toSignal(
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this._route.firstChild?.snapshot.url[0]?.path)
    )
  );

  /** Whether the data model shown can be deleted, asked once it shows. */
  readonly deleteCheck = signal<CanDo | undefined>(undefined);

  constructor() {
    // The bin says whether the data model can be deleted as soon as the data model shows.
    effect(() => {
      const iri = this.state.selected()?.iri;
      if (iri && this.state.canEdit() && this.editing.canEditDataModels) this.checkDelete(iri);
    });
  }

  /**
   * The views of the data model picked: its resource classes first, as the Data models tab lists them, its properties,
   * then its diagram.
   */
  readonly modelSections = computed(() => [
    { path: RouteConstants.classes, count: this.state.classRows().length },
    { path: RouteConstants.properties, count: this.state.propertyRows().length },
    { path: RouteConstants.graph, count: undefined },
  ]);

  /** The data model whose deletion was last asked about; showing it again asks no more. */
  private _checked?: string;

  /** Asks the API whether the data model can be deleted, for its bin to say so. */
  checkDelete(ontologyIri: string): void {
    if (this._checked === ontologyIri) return;
    this._checked = ontologyIri;
    this.deleteCheck.set(undefined);
    this.editing
      .canDeleteDataModel(ontologyIri)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(check => this.deleteCheck.set(check));
  }

  editModel(): void {
    const selected = this.state.selected();
    if (!selected) return;
    this.editing.editDataModel({ ...selected, comment: this.state.commentOf(selected.iri) });
  }

  /** Deletes the data model once confirmed, then goes back to the Overview. */
  deleteModel(ontologyIri: string, label: string): void {
    this.editing
      .deleteDataModel(ontologyIri, label)
      .pipe(filter(Boolean), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._router.navigate([RouteConstants.overview], { relativeTo: this._route }));
  }

  /** Shows another data model in the same section, with no panel open and no filter. */
  show(ontologyIri: string): void {
    this._router.navigate([], {
      relativeTo: this._route.firstChild,
      queryParams: { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) },
    });
  }
}
