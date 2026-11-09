import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemMeta, MatNavList } from '@angular/material/list';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import {
  ActivatedRoute,
  IsActiveMatchOptions,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslatePipe } from '@ngx-translate/core';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { DataModelsRailState } from './data-models-rail-state';

/**
 * The Data models 2 tab: a rail to pick a data model and a section of it (the graph, its classes, its properties, the
 * project's lists), the section beside it.
 */
@Component({
  selector: 'app-data-models-rail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataModelsRailState],
  imports: [
    MatButton,
    MatDivider,
    MatIcon,
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
      <aside class="rail" data-cy="data-models-rail">
        @if (state.selected(); as selected) {
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
        }

        <!-- The picked data model's own views, under its picker. -->
        <mat-nav-list>
          @for (section of modelSections(); track section.path) {
            <ng-container [ngTemplateOutlet]="link" [ngTemplateOutletContext]="{ $implicit: section }" />
          }
        </mat-nav-list>

        <!-- What the project's data models share, whichever is picked. -->
        <mat-divider class="divider" />
        <span class="heading">{{ r + '.project' | translate }}</span>
        <mat-nav-list>
          @for (section of projectSections(); track section.path) {
            <ng-container [ngTemplateOutlet]="link" [ngTemplateOutletContext]="{ $implicit: section }" />
          }
        </mat-nav-list>

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
        // Material sets a taller fixed height on items with a leading icon.
        height: 36px;
        border-radius: 6px;
        cursor: pointer;

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

      .divider {
        margin: 12px 4px 0;
      }

      .heading {
        display: block;
        padding: 12px 12px 4px;
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: $cool_gray_500;
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

  /** The views of the data model picked: its diagram, its resource classes and its properties. */
  readonly modelSections = computed(() => [
    { path: RouteConstants.graph, icon: 'hub', count: undefined },
    { path: RouteConstants.classes, icon: 'view_list', count: this.state.classRows().length },
    { path: RouteConstants.properties, icon: 'label', count: this.state.propertyRows().length },
  ]);
  /** The lists belong to the project, not to a data model: every data model of the project can use them. */
  readonly projectSections = computed(() => [
    { path: RouteConstants.lists, icon: 'format_list_bulleted', count: this.state.lists()?.length },
  ]);

  /** Shows another data model in the same section, with no panel open and no filter. */
  show(ontologyIri: string): void {
    this._router.navigate([], {
      relativeTo: this._route.firstChild,
      queryParams: { [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri) },
    });
  }
}
