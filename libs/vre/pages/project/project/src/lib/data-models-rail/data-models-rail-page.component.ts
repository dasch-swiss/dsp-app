import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemMeta, MatNavList } from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
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
 * The Data models 2 tab: first the Overview, as the Data models tab's page, then, for a data model opened there, a rail
 * to go back, pick another data model and a section of it (its classes, its properties, its diagram), the section
 * beside it. Controlled vocabularies, opened from the Overview, show with the way back only.
 */
@Component({
  selector: 'app-data-models-rail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataModelsRailState],
  imports: [
    MatButton,
    MatIcon,
    MatIconButton,
    MatListItem,
    MatListItemIcon,
    MatListItemMeta,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatNavList,
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    <div class="page">
      @if (section() !== overview) {
        <aside class="rail" data-cy="data-models-rail">
          <!-- Back to every data model and vocabulary of the project. -->
          <mat-nav-list class="back">
            <a mat-list-item class="rail-link" data-cy="data-models-rail-back" [routerLink]="overview">
              <mat-icon matListItemIcon>arrow_back</mat-icon>
              {{ r + '.backToOverview' | translate }}
            </a>
          </mat-nav-list>

          @if (section() !== lists) {
            @if (state.selected(); as selected) {
              <div class="model">
                @if (state.ontologies().length > 1) {
                  <button
                    mat-stroked-button
                    class="picker"
                    data-cy="data-models-rail-picker"
                    [attr.aria-label]="'pages.ontologyMap.dataModel' | translate"
                    [matMenuTriggerFor]="models">
                    <b>{{ selected.label }}</b>
                    <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
                  </button>
                  <mat-menu #models="matMenu">
                    @for (ontology of state.ontologies(); track ontology.iri) {
                      <button mat-menu-item (click)="show(ontology.iri)">{{ ontology.label }}</button>
                    }
                  </mat-menu>
                } @else {
                  <span class="picker static" data-cy="data-models-rail-picker">{{ selected.label }}</span>
                }
                <!-- For editors: the data model's own label and comment, and deleting it once nothing uses it. -->
                @if (state.canEdit() && editing.canEditDataModels) {
                  <button
                    mat-icon-button
                    type="button"
                    class="model-menu"
                    data-cy="data-models-rail-model-menu"
                    [attr.aria-label]="r + '.dataModelActions' | translate: { model: selected.label }"
                    [matMenuTriggerFor]="modelMenu"
                    (menuOpened)="checkDelete(selected.iri)">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #modelMenu="matMenu">
                    <button mat-menu-item type="button" data-cy="data-models-rail-edit-model" (click)="editModel()">
                      <mat-icon>edit</mat-icon>
                      {{ r + '.editDataModel' | translate }}
                    </button>
                    @let check = deleteCheck();
                    <button
                      mat-menu-item
                      type="button"
                      data-cy="data-models-rail-delete-model"
                      [disabled]="!check?.canDo"
                      (click)="deleteModel(selected.iri, selected.label)">
                      <mat-icon>delete</mat-icon>
                      <span class="menu-texts">
                        {{ r + '.deleteDataModel' | translate }}
                        @if (!check) {
                          <small>{{ r + '.checkingDelete' | translate }}</small>
                        } @else if (!check.canDo) {
                          <small>{{ r + '.cannotDeleteDataModel' | translate }}</small>
                        }
                      </span>
                    </button>
                  </mat-menu>
                }
              </div>
            }

            <!-- The picked data model's own views, under its picker. -->
            <mat-nav-list>
              @for (section of modelSections(); track section.path) {
                <ng-container [ngTemplateOutlet]="link" [ngTemplateOutletContext]="{ $implicit: section }" />
              }
            </mat-nav-list>
          }

          <ng-template #link let-section>
            <a
              mat-list-item
              routerLinkActive
              #active="routerLinkActive"
              [routerLinkActiveOptions]="activeOptions"
              class="rail-link"
              [class.current]="active.isActive"
              [activated]="active.isActive"
              [attr.aria-current]="active.isActive ? 'page' : null"
              [routerLink]="section.path"
              [queryParams]="state.modelParam()"
              [attr.data-cy]="'data-models-rail-' + section.path">
              <mat-icon matListItemIcon>{{ section.icon }}</mat-icon>
              {{ r + '.' + section.path | translate }}
              @if (section.count !== undefined) {
                <span matListItemMeta class="count">{{ section.count }}</span>
              }
            </a>
          </ng-template>
        </aside>
      }

      <main class="content">
        <router-outlet />
      </main>
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
        width: 248px;
        box-sizing: border-box;
        padding: 12px 8px;
        border-right: 1px solid $cool_gray_200;
        overflow: auto;

        mat-nav-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0;
        }
      }

      // Rail rows as in the V3 design: compact, rounded, a pale blue for the current section. Specific enough to win
      // over Material's own list item rules.
      .rail .rail-link.mat-mdc-list-item {
        --mat-list-list-item-one-line-container-height: 36px;
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
        // Material sets a taller fixed height on items with a leading icon; a longer name wraps onto a second line,
        // in full, rather than being cut.
        height: auto;
        min-height: 36px;
        padding-top: 6px;
        padding-bottom: 6px;
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
      }

      .picker {
        display: flex;
        justify-content: space-between;
        width: calc(100% - 8px);
        margin: 0 4px 10px;
        --mat-button-outlined-container-shape: 6px;
        --mat-button-outlined-container-height: 38px;
        background: white;
        cursor: pointer;

        b {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &.static {
          cursor: default;
          box-sizing: border-box;
          padding: 8px 12px;
          border: 1px solid $cool_gray_300;
          border-radius: 6px;
          font-weight: 500;
        }
      }

      .back {
        margin-bottom: 10px;
      }

      // The picker and the data model's menu on one line.
      .model {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-bottom: 10px;

        .picker {
          flex: 1;
          min-width: 0;
          width: auto;
          margin: 0 0 0 4px;
        }
      }

      .menu-texts {
        display: flex;
        flex-direction: column;

        small {
          color: $cool_gray_500;
        }
      }

      .count {
        font-size: 12px;
        font-weight: 400;
        color: $cool_gray_500;
      }

      .content {
        flex: 1;
        min-width: 0;
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

  /** Whether the data model shown can be deleted, asked once its menu opens. */
  readonly deleteCheck = signal<CanDo | undefined>(undefined);

  /**
   * The views of the data model picked: its resource classes first, as the Data models tab lists them, its properties,
   * then its diagram.
   */
  readonly modelSections = computed(() => [
    { path: RouteConstants.classes, icon: 'view_list', count: this.state.classRows().length },
    { path: RouteConstants.properties, icon: 'label', count: this.state.propertyRows().length },
    { path: RouteConstants.graph, icon: 'hub', count: undefined },
  ]);

  checkDelete(ontologyIri: string): void {
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
