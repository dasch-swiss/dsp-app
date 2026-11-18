import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemMeta, MatNavList } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map, startWith } from 'rxjs';
import { CanDo, injectDataModelEditing } from '../ontology-map/data-model-editor';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { VOCABULARY_PARAM } from './data-models-overview.component';
import { DataModelsRailState } from './data-models-rail-state';

/** A data model's sections, in the order the rail lists them under it. */
const MODEL_SECTIONS = [
  { path: RouteConstants.classes, icon: 'view_list' },
  { path: RouteConstants.properties, icon: 'label' },
  { path: RouteConstants.graph, icon: 'hub' },
] as const;

/**
 * The Data models 3 tab: a rail listing every data model of the project as a group that folds open on its sections
 * (its classes, its properties, its diagram), then what the project's data models share (the controlled
 * vocabularies) and the documentation; the section picked beside it. No overview: the tab opens on the first data
 * model's classes. Editors create a data model or a vocabulary from the "+" by each heading, and edit or delete a data
 * model with the pen and the bin shown on hover.
 */
@Component({
  selector: 'app-data-models-tree-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataModelsRailState],
  imports: [
    MatIcon,
    MatIconButton,
    MatListItem,
    MatListItemIcon,
    MatListItemMeta,
    MatNavList,
    MatTooltip,
    RouterLink,
    RouterOutlet,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    @let editor = state.canEdit() && editing.canEditDataModels;
    <div class="page">
      <aside class="rail" data-cy="data-models-tree">
        <div class="heading">
          <span>{{ r + '.dataModels' | translate }}</span>
          @if (editor) {
            <button
              mat-icon-button
              type="button"
              class="small"
              data-cy="data-models-tree-create-model"
              [attr.aria-label]="r + '.createDataModel' | translate"
              [matTooltip]="r + '.createDataModel' | translate"
              (click)="createDataModel()">
              <mat-icon>add</mat-icon>
            </button>
          }
        </div>

        @for (model of state.ontologies(); track model.iri) {
          @let open = expanded().has(model.iri);
          @let current = model.iri === state.selected()?.iri;
          @let counts = state.counts().get(model.iri);
          <!-- The data model: its fold, its name (opens it), and for editors, on hover, its pen and bin. -->
          <div
            class="model"
            [class.current]="current"
            data-cy="data-models-tree-model"
            (mouseenter)="editor && checkDelete(model.iri)">
            <button
              mat-icon-button
              type="button"
              class="small fold"
              [attr.aria-expanded]="open"
              [attr.aria-label]="r + '.showSections' | translate: { model: model.label }"
              (click)="toggle(model.iri)">
              <mat-icon>{{ open ? 'expand_more' : 'chevron_right' }}</mat-icon>
            </button>
            <button type="button" class="name" (click)="openModel(model.iri)">{{ model.label }}</button>
            @if (editor) {
              <button
                mat-icon-button
                type="button"
                class="small hover-action"
                data-cy="data-models-tree-edit-model"
                [attr.aria-label]="r + '.editDataModel' | translate"
                [matTooltip]="r + '.editDataModel' | translate"
                (click)="editModel(model)">
                <mat-icon>edit</mat-icon>
              </button>
              @let check = deleteChecks().get(model.iri);
              <span
                class="hover-action"
                [matTooltip]="
                  (!check ? r + '.checkingDelete' : check.canDo ? r + '.deleteDataModel' : r + '.cannotDeleteDataModel')
                    | translate
                ">
                <button
                  mat-icon-button
                  type="button"
                  class="small delete"
                  data-cy="data-models-tree-delete-model"
                  [attr.aria-label]="r + '.deleteDataModel' | translate"
                  [disabled]="!check?.canDo"
                  (click)="deleteModel(model.iri, model.label)">
                  <mat-icon>delete</mat-icon>
                </button>
              </span>
            }
          </div>
          @if (open) {
            <mat-nav-list class="sections">
              @for (item of sections; track item.path) {
                @let active = current && section() === item.path;
                <a
                  mat-list-item
                  class="rail-link"
                  [class.current]="active"
                  [activated]="active"
                  [attr.aria-current]="active ? 'page' : null"
                  [routerLink]="item.path"
                  [queryParams]="paramOf(model.iri)"
                  [attr.data-cy]="'data-models-tree-' + item.path">
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  {{ r + '.' + item.path | translate }}
                  @if (item.path === classes && counts) {
                    <span matListItemMeta class="count">{{ counts.classes }}</span>
                  } @else if (item.path === properties && counts) {
                    <span matListItemMeta class="count">{{ counts.properties }}</span>
                  }
                </a>
              }
            </mat-nav-list>
          }
        }

        <!-- What the project's data models share. -->
        <div class="heading project">
          <span>{{ r + '.project' | translate }}</span>
          @if (state.canEdit() && editing.canCreate) {
            <button
              mat-icon-button
              type="button"
              class="small"
              data-cy="data-models-tree-create-vocabulary"
              [attr.aria-label]="r + '.createVocabulary' | translate"
              [matTooltip]="r + '.createVocabulary' | translate"
              (click)="createVocabulary()">
              <mat-icon>add</mat-icon>
            </button>
          }
        </div>
        <mat-nav-list class="sections flat">
          @let onLists = section() === lists;
          <a
            mat-list-item
            class="rail-link"
            [class.current]="onLists"
            [activated]="onLists"
            [attr.aria-current]="onLists ? 'page' : null"
            [routerLink]="lists"
            [queryParams]="state.modelParam()"
            data-cy="data-models-tree-lists">
            <mat-icon matListItemIcon>format_list_bulleted</mat-icon>
            {{ r + '.lists' | translate }}
            @if (state.lists(); as vocabularies) {
              <span matListItemMeta class="count">{{ vocabularies.length }}</span>
            }
          </a>
          @if (state.canEdit()) {
            <a mat-list-item class="rail-link docs" [href]="docs" target="_blank" rel="noopener">
              <mat-icon matListItemIcon>open_in_new</mat-icon>
              {{ r + '.documentation' | translate }}
            </a>
          }
        </mat-nav-list>
      </aside>

      <div class="main">
        <main class="content">
          <router-outlet />
        </main>
      </div>
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
        height: 100%;
      }

      .rail {
        flex: none;
        width: 264px;
        box-sizing: border-box;
        padding: 8px 8px 16px;
        border-right: 1px solid $cool_gray_200;
        overflow: auto;
        background: white;
      }

      // "Data models" and "Project", with their "+".
      .heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 36px;
        padding: 4px 4px 0 12px;
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;

        &.project {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid $cool_gray_200;
        }
      }

      // A data model's line: fold, name, and on hover its pen and bin.
      .model {
        display: flex;
        align-items: center;
        min-height: 36px;
        padding-right: 2px;
        border-radius: 6px;

        &:hover {
          background: $cool_gray_50;
        }

        .hover-action {
          flex: none;
          visibility: hidden;
        }

        &:hover .hover-action,
        .hover-action:focus-within,
        .hover-action:focus-visible {
          visibility: visible;
        }

        .fold {
          color: $cool_gray_500;
        }
      }

      .name {
        flex: 1;
        min-width: 0;
        padding: 6px 4px;
        border: 0;
        background: none;
        font: inherit;
        font-size: 14px;
        font-weight: 500;
        color: $cool_gray_900;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
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

      // A data model's sections, set in under its name.
      .sections {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 0 0 6px 20px;

        &.flat {
          padding-left: 0;
        }
      }

      // Rail rows as in the V3 design: compact, rounded, a pale blue for the current section. Specific enough to win
      // over Material's own list item rules.
      .rail .rail-link.mat-mdc-list-item {
        --mat-list-list-item-one-line-container-height: 34px;
        --mat-list-list-item-leading-icon-size: 18px;
        --mat-list-list-item-leading-icon-start-space: 12px;
        --mat-list-list-item-leading-icon-end-space: 10px;
        --mat-list-list-item-label-text-size: 14px;
        --mat-list-list-item-label-text-color: #{$cool_gray_700};
        --mat-list-list-item-hover-label-text-color: #{$cool_gray_900};
        --mat-list-list-item-leading-icon-color: #{$cool_gray_500};
        --mat-list-list-item-hover-leading-icon-color: #{$cool_gray_700};
        --mat-list-list-item-hover-state-layer-color: #{$cool_gray_500};
        --mat-list-list-item-hover-state-layer-opacity: 0.08;
        --mat-list-active-indicator-shape: 6px;
        --mat-list-active-indicator-color: transparent;
        height: auto;
        min-height: 34px;
        padding-top: 5px;
        padding-bottom: 5px;
        border-radius: 6px;
        cursor: pointer;

        ::ng-deep .mdc-list-item__primary-text {
          white-space: normal;
          line-height: 18px;
        }

        &.current {
          --mat-list-list-item-label-text-color: #{$primary_700};
          --mat-list-list-item-hover-label-text-color: #{$primary_700};
          --mat-list-list-item-leading-icon-color: #{$primary};
          --mat-list-list-item-hover-leading-icon-color: #{$primary};
          background: $primary_50;
          font-weight: 500;

          .count {
            color: $primary_700;
          }
        }

        &.docs {
          --mat-list-list-item-label-text-color: #{$cool_gray_500};
        }
      }

      .count {
        font-size: 12px;
        font-weight: 400;
        color: $cool_gray_500;
      }

      .main {
        flex: 1;
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }

      .content {
        flex: 1;
        min-height: 0;
        background: $cool_gray_50;
      }
    `,
  ],
})
export class DataModelsTreePageComponent {
  readonly state = inject(DataModelsRailState);
  readonly editing = injectDataModelEditing();
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);

  readonly sections = MODEL_SECTIONS;
  readonly classes = RouteConstants.classes;
  readonly properties = RouteConstants.properties;
  readonly lists = RouteConstants.lists;
  readonly docs = 'https://dasch.swiss/knowledge-hub/dsp-app/project-admin#data-model';

  /** The section shown: one of a data model's, or the controlled vocabularies. */
  readonly section = toSignal(
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this._route.firstChild?.snapshot?.url?.[0]?.path)
    )
  );

  /** The data models folded open on their sections; the one shown opens by itself. */
  readonly expanded = signal(new Set<string>());

  /** What the API says of deleting each data model hovered. */
  readonly deleteChecks = signal(new Map<string, CanDo>());
  private readonly _checked = new Set<string>();

  constructor() {
    // The sections' links and "Open in…" lead to this tab, not to Data models 2.
    this.state.tab = RouteConstants.dataModels3;
    // The data model shown folds open when it changes; folding it again is the viewer's choice.
    effect(() => {
      const iri = this.state.selected()?.iri;
      if (iri) untracked(() => this.expanded.update(open => new Set(open).add(iri)));
    });
  }

  /** The query parameter naming the data model, for its sections' links. */
  paramOf(ontologyIri: string): Record<string, string> {
    return { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) };
  }

  toggle(ontologyIri: string): void {
    this.expanded.update(open => {
      const next = new Set(open);
      if (!next.delete(ontologyIri)) next.add(ontologyIri);
      return next;
    });
  }

  /** Opens the data model in the section shown, or on its classes from the vocabularies; folds it open. */
  openModel(ontologyIri: string): void {
    const section = this.section();
    const keep = MODEL_SECTIONS.some(known => known.path === section) ? section! : RouteConstants.classes;
    this.expanded.update(open => new Set(open).add(ontologyIri));
    this._router.navigate([keep], { relativeTo: this._route, queryParams: this.paramOf(ontologyIri) });
  }

  /** Asks the API whether the data model can be deleted, for its bin to say so; once per data model. */
  checkDelete(ontologyIri: string): void {
    if (this._checked.has(ontologyIri)) return;
    this._checked.add(ontologyIri);
    this.editing
      .canDeleteDataModel(ontologyIri)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(check => this.deleteChecks.update(checks => new Map(checks).set(ontologyIri, check)));
  }

  editModel(model: { iri: string; label: string }): void {
    this.editing.editDataModel({ ...model, comment: this.state.commentOf(model.iri) });
  }

  /** Deletes the data model once confirmed, then shows the first data model left. */
  deleteModel(ontologyIri: string, label: string): void {
    this.editing
      .deleteDataModel(ontologyIri, label)
      .pipe(filter(Boolean), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._router.navigate([RouteConstants.classes], { relativeTo: this._route }));
  }

  /** Creates a data model, then opens it, ready for its first classes. */
  createDataModel(): void {
    this.editing.createDataModel(iri => {
      this.expanded.update(open => new Set(open).add(iri));
      this._router.navigate([RouteConstants.classes], { relativeTo: this._route, queryParams: this.paramOf(iri) });
    });
  }

  /** Creates a controlled vocabulary, then shows it opened, ready for its first values. */
  createVocabulary(): void {
    this.editing.createVocabulary(iri =>
      this._router.navigate([RouteConstants.lists], {
        relativeTo: this._route,
        queryParams: { ...this.state.modelParam(), [VOCABULARY_PARAM]: iri.split('/').pop() ?? '' },
      })
    );
  }
}
