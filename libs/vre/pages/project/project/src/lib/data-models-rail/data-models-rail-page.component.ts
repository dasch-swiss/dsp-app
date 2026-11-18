import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemMeta, MatNavList } from '@angular/material/list';
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
import { rememberedSignal } from './remembered-signal';

/** Where a data model's sections show: as tabs in one bar on top, or in a sidebar on the left. */
export type DataModelsLayout = 'top' | 'side';

/**
 * The Data models 2 tab: first the Overview, as the Data models tab's page, then, for a data model opened there, the way
 * back, the data model's name (to pick another, edit or delete it), its sections (its classes, its properties, its
 * diagram) and the section's tools, in one bar on top or in a sidebar, as the viewer chose. Controlled vocabularies,
 * opened from the Overview, show with the way back and their tools only.
 */
@Component({
  selector: 'app-data-models-rail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataModelsRailState],
  imports: [
    MatIcon,
    MatIconButton,
    MatListItem,
    MatListItemIcon,
    MatListItemMeta,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatNavList,
    MatTabLink,
    MatTabNav,
    MatTabNavPanel,
    MatTooltip,
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
  ],
  template: `
    @let r = 'pages.dataModels2';
    @let onModel = section() !== lists;
    <div class="page" [class.side]="layout() === 'side'">
      @if (section() !== overview) {
        @if (layout() === 'top') {
          <!-- Back, the data model's name, its sections as tabs, then the section's tools, on one line. -->
          <header class="bar" data-cy="data-models-rail">
            <a
              mat-icon-button
              class="back"
              data-cy="data-models-rail-back"
              [routerLink]="overview"
              [attr.aria-label]="r + '.backToOverview' | translate"
              [matTooltip]="r + '.backToOverview' | translate">
              <mat-icon>chevron_left</mat-icon>
            </a>
            @if (onModel && state.selected(); as selected) {
              <ng-container [ngTemplateOutlet]="model" [ngTemplateOutletContext]="{ $implicit: selected }" />
              <span class="divider"></span>
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
            <span class="spacer"></span>
            <ng-container [ngTemplateOutlet]="toggle" />
          </header>
        } @else {
          <!-- The way back, the data model's name and its sections, on the left. -->
          <aside class="rail" data-cy="data-models-rail">
            <div class="rail-top">
              <mat-nav-list class="back-list">
                <a mat-list-item class="rail-link" data-cy="data-models-rail-back" [routerLink]="overview">
                  <mat-icon matListItemIcon>arrow_back</mat-icon>
                  {{ r + '.backToOverview' | translate }}
                </a>
              </mat-nav-list>
              <ng-container [ngTemplateOutlet]="toggle" />
            </div>
            @if (onModel && state.selected(); as selected) {
              <div class="rail-model">
                <ng-container [ngTemplateOutlet]="model" [ngTemplateOutletContext]="{ $implicit: selected }" />
              </div>
              <mat-nav-list>
                @for (section of modelSections(); track section.path) {
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
                }
              </mat-nav-list>
            }
          </aside>
        }
      }

      <div class="main">
        <mat-tab-nav-panel #panel class="content">
          <router-outlet />
        </mat-tab-nav-panel>
      </div>
    </div>

    <!-- The data model's name, a menu to pick another when there are several; for editors, on hover, its pen and bin. -->
    <ng-template #model let-selected>
      <span class="model">
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
        @if (state.canEdit() && editing.canEditDataModels) {
          <button
            mat-icon-button
            type="button"
            class="small hover-action"
            data-cy="data-models-rail-edit-model"
            [attr.aria-label]="r + '.editDataModel' | translate"
            [matTooltip]="r + '.editDataModel' | translate"
            (click)="editModel()">
            <mat-icon>edit</mat-icon>
          </button>
          @let check = deleteCheck();
          <!-- Deletes once the API says nothing uses the data model; why not, on hover, otherwise. -->
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
              data-cy="data-models-rail-delete-model"
              [attr.aria-label]="r + '.deleteDataModel' | translate"
              [disabled]="!check?.canDo"
              (click)="deleteModel(selected.iri, selected.label)">
              <mat-icon>delete</mat-icon>
            </button>
          </span>
        }
      </span>
    </ng-template>

    <!-- Switches between the bar on top and the sidebar; remembered in this browser. -->
    <ng-template #toggle>
      @let next = layout() === 'top' ? 'side' : 'top';
      <button
        mat-icon-button
        type="button"
        class="small toggle"
        data-cy="data-models-layout-toggle"
        [attr.aria-label]="(next === 'side' ? r + '.layoutSide' : r + '.layoutTop') | translate"
        [matTooltip]="(next === 'side' ? r + '.layoutSide' : r + '.layoutTop') | translate"
        (click)="layout.set(next)">
        <mat-icon>{{ next === 'side' ? 'view_sidebar' : 'view_day' }}</mat-icon>
      </button>
    </ng-template>
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

        &.side {
          flex-direction: row;
        }
      }

      .main {
        flex: 1;
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }

      .content {
        display: block;
        flex: 1;
        min-height: 0;
        background: $cool_gray_50;
      }

      // The bar on top: back, the data model's name, its sections as tabs, the section's tools, the toggle.
      .bar {
        flex: none;
        display: flex;
        align-items: center;
        gap: 4px;
        min-height: 48px;
        padding: 0 8px;
        border-bottom: 1px solid $cool_gray_200;
        background: white;
      }

      .back {
        color: $cool_gray_600;
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
        flex: none;
        --mat-tab-container-height: 48px;
        border-bottom: 0;

        .mat-mdc-tab-link {
          min-width: 0;
          padding: 0 12px;
        }
      }

      .spacer {
        flex: 1;
      }

      .count {
        margin-left: 6px;
        font-size: 12px;
        font-weight: 400;
        color: $cool_gray_500;
      }

      // The data model's name; for editors, its pen and bin on hover.
      .model {
        display: inline-flex;
        align-items: center;
        min-width: 0;

        .hover-action {
          flex: none;
          visibility: hidden;
        }

        &:hover .hover-action,
        .hover-action:focus-within,
        .hover-action:focus-visible {
          visibility: visible;
        }
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

      .toggle {
        flex: none;
        color: $cool_gray_500;
      }

      // The data model's pen and bin in the app's blue, as elsewhere; the bin turns red only while pointed at.
      .model button.hover-action:not([disabled]),
      .model .delete:not([disabled]) {
        color: $primary;
      }

      .model .delete:not([disabled]):hover {
        color: #b3261e;
        background: #fdecea;
      }

      // The sidebar.
      .rail {
        flex: none;
        width: 248px;
        box-sizing: border-box;
        padding: 12px 8px;
        border-right: 1px solid $cool_gray_200;
        overflow: auto;
        background: white;

        mat-nav-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0;
        }
      }

      .rail-top {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .back-list {
          flex: 1;
          min-width: 0;
        }
      }

      .rail-model {
        display: flex;
        align-items: center;
        min-height: 40px;
        margin-bottom: 6px;
        padding-left: 12px;

        .model {
          width: 100%;
        }

        .name {
          flex: 0 1 auto;
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

        .count {
          margin-left: 0;
        }
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

  /** Where the sections show, as the viewer last chose: in the bar on top, or in a sidebar. */
  readonly layout = rememberedSignal<DataModelsLayout>('dsp-data-models-layout', 'top', stored =>
    stored === 'side' || stored === 'top' ? stored : undefined
  );
  readonly lists = RouteConstants.lists;

  /** The section shown: the Overview, a data model's section, or Controlled vocabularies. */
  readonly section = toSignal(
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this._route.firstChild?.snapshot?.url?.[0]?.path)
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
    { path: RouteConstants.classes, icon: 'view_list', count: this.state.classRows().length },
    { path: RouteConstants.properties, icon: 'label', count: this.state.propertyRows().length },
    { path: RouteConstants.graph, icon: 'hub', count: undefined },
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
