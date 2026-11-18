import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { CenteredLayoutComponent, ClickableListCardComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { injectDataModelEditing } from '../ontology-map/data-model-editor';
import { ONTOLOGY_MAP_PARAM } from '../ontology-map/ontology-map-page.component';
import { DataModelsRailState } from './data-models-rail-state';

/** The query parameter naming the controlled vocabulary to open on arriving at Controlled vocabularies. */
export const VOCABULARY_PARAM = 'vocabulary';

/**
 * Data models 2's first page, as the Data models tab's: the project's data models and controlled vocabularies, to open
 * one, and for editors to create one. A data model opens on its resource classes, with the rail beside it.
 */
@Component({
  selector: 'app-data-models-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CenteredLayoutComponent,
    ClickableListCardComponent,
    MatButton,
    MatIcon,
    MatListItem,
    MatListItemIcon,
    MatTooltip,
    StringifyStringLiteralPipe,
    TranslatePipe,
  ],
  template: `
    <app-centered-layout data-cy="data-models-overview">
      <div class="title-row">
        <div class="mat-subtitle-1 title">
          <span>{{ 'pages.ontology.dataModels.title' | translate }}</span>
          <mat-icon
            color="primary"
            class="info"
            [matTooltip]="'pages.ontology.dataModels.info' | translate"
            matTooltipPosition="above">
            info
          </mat-icon>
        </div>
        @if (state.canEdit()) {
          <div class="actions">
            <a color="primary" mat-stroked-button class="docs" [href]="docs" target="_blank" rel="noopener">
              {{ 'pages.ontology.dataModels.documentation' | translate }}
              <mat-icon>chevron_right</mat-icon>
            </a>
            @if (editing.canEditDataModels) {
              <button
                color="primary"
                data-cy="data-models-overview-create-model"
                mat-raised-button
                (click)="createDataModel()">
                <mat-icon>add_circle</mat-icon>
                <span>{{ 'pages.ontology.dataModels.createNew' | translate }}</span>
              </button>
            }
          </div>
        }
      </div>

      @if (state.loaded()) {
        <app-clickable-list-card>
          @for (model of state.ontologies(); track model.iri) {
            <mat-list-item data-cy="data-models-overview-model" (click)="openModel(model.iri)">
              <mat-icon matListItemIcon>bubble_chart</mat-icon>
              <div matLine>{{ model.label }}</div>
            </mat-list-item>
          }
        </app-clickable-list-card>
      }

      <div class="title-row vocabularies">
        <div class="mat-subtitle-1 title">
          <span>{{ 'pages.ontology.dataModels.vocabularies.title' | translate }}</span>
          <mat-icon
            color="primary"
            class="info"
            [matTooltip]="'pages.ontology.dataModels.vocabularies.info' | translate"
            matTooltipPosition="above">
            info
          </mat-icon>
        </div>
        @if (state.canEdit() && editing.canCreate) {
          <button
            color="primary"
            data-cy="data-models-overview-create-vocabulary"
            mat-raised-button
            (click)="createVocabulary()">
            <mat-icon>add_circle</mat-icon>
            {{ 'pages.ontology.dataModels.vocabularies.createNew' | translate }}
          </button>
        }
      </div>

      <app-clickable-list-card>
        @for (list of state.lists() ?? []; track list.id) {
          <mat-list-item data-cy="data-models-overview-vocabulary" (click)="openVocabulary(list.id)">
            <mat-icon matListItemIcon>list</mat-icon>
            <div matLine>{{ list.labels | appStringifyStringLiteral }}</div>
          </mat-list-item>
        }
      </app-clickable-list-card>
    </app-centered-layout>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        overflow: auto;
        background: white;
      }

      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .title {
        margin-bottom: 0;
        display: flex;
        align-items: center;
      }

      .info {
        margin-left: 8px;
      }

      .actions {
        display: flex;
        gap: 8px;
      }

      .vocabularies {
        margin-top: 80px;
      }
    `,
  ],
})
export class DataModelsOverviewComponent {
  readonly state = inject(DataModelsRailState);
  readonly editing = injectDataModelEditing();

  readonly docs = 'https://dasch.swiss/knowledge-hub/dsp-app/project-admin#data-model';

  /** Opens the data model on its resource classes. */
  openModel(ontologyIri: string): void {
    this.state.openSection(RouteConstants.classes, {
      [ONTOLOGY_MAP_PARAM.ontology]: OntologyService.getOntologyNameFromIri(ontologyIri),
    });
  }

  /** Opens Controlled vocabularies with this one unfolded. */
  openVocabulary(listIri: string): void {
    this.state.openSection(RouteConstants.lists, { [VOCABULARY_PARAM]: listIri.split('/').pop() ?? '' });
  }

  /** Creates a data model, then opens it, ready for its first classes. */
  createDataModel(): void {
    this.editing.createDataModel(iri => this.openModel(iri));
  }

  /** Creates a vocabulary, then opens it, ready for its first values. */
  createVocabulary(): void {
    this.editing.createVocabulary(iri => this.openVocabulary(iri));
  }
}
