import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewContainerRef } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { OntologyMetadata, ReadOntology } from '@dasch-swiss/dsp-js';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, take } from 'rxjs';
import { EditOntologyFormDialogComponent } from './forms/ontology-form/edit-ontology-form-dialog.component';
import { UpdateOntologyData } from './forms/ontology-form/ontology-form.type';
import { OntologyEditService } from './services/ontology-edit.service';

@Component({
  selector: 'app-ontology-editor-header',
  template: `
    @if (ontology$ | async; as ontology) {
      <mat-toolbar class="ontology-editor-header">
        <mat-toolbar-row>
          <button
            class="back-button"
            data-cy="back-to-data-models"
            mat-button
            (click)="navigateToDataModels()"
            [matTooltip]="_translate.instant('pages.ontology.editor.backToDataModels')">
            <mat-icon class="centered-icon">chevron_left</mat-icon>
          </button>
          <div class="ontology-info">
            <h3
              data-cy="ontology-label"
              class="mat-headline-6"
              [matTooltip]="ontology?.comment ? ontology.label + ' &mdash; ' + ontology?.comment : ''"
              matTooltipPosition="above">
              {{ ontology.label }}
            </h3>
            <p class="mat-caption">
              <span>
                {{ _translate.instant('pages.ontology.editor.updatedOn') }}
                {{ ontology.lastModificationDate | date: 'medium' }}
              </span>
            </p>
          </div>
          <span class="fill-remaining-space"></span>
          @if ((hasProjectAdminRights$ | async) === true) {
            <div>
              <button
                color="primary"
                data-cy="edit-ontology-button"
                mat-button
                [matTooltip]="
                  (hasProjectAdminRights$ | async) ? _translate.instant('pages.ontology.editor.editInfo') : ''
                "
                [disabled]="(project$ | async)?.status !== true"
                (click)="$event.stopPropagation(); editOntology(ontology)">
                <mat-icon>edit</mat-icon>
                {{ _translate.instant('ui.common.actions.edit') }}
              </button>
              <button
                color="warn"
                mat-button
                [matTooltip]="
                  (currentOntologyCanBeDeleted$ | async)
                    ? _translate.instant('pages.ontology.editor.deleteTooltip')
                    : _translate.instant('pages.ontology.editor.cannotDelete')
                "
                [disabled]="(currentOntologyCanBeDeleted$ | async) !== true"
                (click)="deleteOntology(ontology.id)">
                <mat-icon>delete</mat-icon>
                {{ _translate.instant('ui.common.actions.delete') }}
              </button>
            </div>
          }
        </mat-toolbar-row>
      </mat-toolbar>
    }
  `,
  styles: `
    .ontology-editor-header {
      margin-top: 0.5em;

      .back-button {
        height: 90%;
        max-width: 0.5rem;
        margin-right: 1em;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;

        .centered-icon {
          margin: 0;
          display: flex;
          justify-content: center;
          align-self: center;
          text-align: center;
        }
      }

      .ontology-info {
        h3,
        p {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
          padding: 0;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DatePipe, MatButton, MatIcon, MatToolbar, MatToolbarRow, MatTooltip, TranslateModule],
})
export class OntologyEditorHeaderComponent {
  ontology$ = this._oes.currentOntologyInfo$;
  currentOntologyCanBeDeleted$ = this._oes.currentOntologyCanBeDeleted$;
  project$ = this._projectPageService.currentProject$;
  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  protected readonly _translate = inject(TranslateService);

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _dialogService: DialogService,
    private readonly _projectPageService: ProjectPageService,
    private readonly _oes: OntologyEditService,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _viewContainerRef: ViewContainerRef
  ) {}

  editOntology(ontology: ReadOntology | OntologyMetadata) {
    const data: UpdateOntologyData = {
      id: ontology.id,
      label: ontology.label,
      comment: ontology.comment || '',
    };
    this._dialog.open<EditOntologyFormDialogComponent, UpdateOntologyData>(EditOntologyFormDialogComponent, {
      ...DspDialogConfig.dialogDrawerConfig(data, true),
      viewContainerRef: this._viewContainerRef,
    });
  }

  deleteOntology(ontologyId: string) {
    this._dialogService
      .afterConfirmation(this._translate.instant('pages.ontology.editor.deleteConfirmation'))
      .pipe(
        switchMap(_del => this._oes.deleteOntology$(ontologyId)),
        take(1)
      )
      .subscribe(() => {
        this.navigateToDataModels();
      });
  }

  navigateToDataModels() {
    const projectUuid = this._projectPageService.currentProjectUuid;
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.dataModels]);
  }
}
