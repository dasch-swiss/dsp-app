import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
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

        <mat-nav-list>
          <span class="heading">{{ r + '.map' | translate }}</span>
          @for (section of mapSections(); track section.path) {
            <ng-container [ngTemplateOutlet]="link" [ngTemplateOutletContext]="{ $implicit: section }" />
          }
          <span class="heading">{{ r + '.definitions' | translate }}</span>
          @for (section of definitionSections(); track section.path) {
            <ng-container [ngTemplateOutlet]="link" [ngTemplateOutletContext]="{ $implicit: section }" />
          }
        </mat-nav-list>

        <ng-template #link let-section>
          <a
            mat-list-item
            routerLinkActive
            #active="routerLinkActive"
            [routerLinkActiveOptions]="activeOptions"
            [activated]="active.isActive"
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
          --mat-list-list-item-one-line-container-height: 36px;
          --mat-list-list-item-label-text-size: 14px;
          --mat-list-active-indicator-shape: 6px;
          padding: 0;
        }
      }

      .picker {
        display: flex;
        justify-content: space-between;
        width: calc(100% - 8px);
        margin: 0 4px 10px;
        --mat-button-outlined-container-shape: 6px;

        b {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &.static {
          box-sizing: border-box;
          padding: 8px 12px;
          border: 1px solid $cool_gray_300;
          border-radius: 6px;
          font-weight: 500;
        }
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

  readonly mapSections = computed(() => [
    { path: RouteConstants.graph, icon: 'hub', count: undefined },
    { path: RouteConstants.classes, icon: 'view_list', count: this.state.classRows().length },
  ]);
  readonly definitionSections = computed(() => [
    { path: RouteConstants.properties, icon: 'label', count: this.state.propertyRows().length },
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
