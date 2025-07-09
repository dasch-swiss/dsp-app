import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { OntologyMetadata, ReadOntology } from '@dasch-swiss/dsp-js';
import { DspDialogConfig, RouteConstants } from '@dasch-swiss/vre/core/config';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { Store } from '@ngxs/store';
import { switchMap, take } from 'rxjs';
import { OntologyFormComponent } from '../forms/ontology-form/ontology-form.component';
import { UpdateOntologyData } from '../forms/ontology-form/ontology-form.type';
import { OntologyEditService } from '../services/ontology-edit.service';

@Component({
  selector: 'app-ontology-editor-header',
  template: `
    <mat-toolbar class="ontology-editor-header" *ngIf="ontology$ | async as ontology">
      <mat-toolbar-row>
        <button class="back-button" mat-button (click)="navigateToDataModels()" matTooltip="Back to data models">
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
            <span> Updated on: {{ ontology.lastModificationDate | date: 'medium' }} </span>
          </p>
        </div>
        <span class="fill-remaining-space"></span>
        <div *ngIf="(isAdmin$ | async) === true">
          <button
            color="primary"
            data-cy="edit-ontology-button"
            mat-button
            [matTooltip]="(isAdmin$ | async) ? 'Edit data model info' : ''"
            [disabled]="(project$ | async)?.status !== true"
            (click)="$event.stopPropagation(); editOntology(ontology)">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
          <button
            color="warn"
            mat-button
            [matTooltip]="
              (currentOntologyCanBeDeleted$ | async)
                ? 'Delete data model'
                : 'This data model cant be deleted because it is in use!'
            "
            [disabled]="(currentOntologyCanBeDeleted$ | async) !== true"
            (click)="deleteOntology(ontology.id)">
            <mat-icon>delete</mat-icon>
            Delete
          </button>
        </div>
      </mat-toolbar-row>
    </mat-toolbar>
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
})
export class OntologyEditorHeaderComponent {
  ontology$ = this._oes.currentOntologyInfo$;
  currentOntologyCanBeDeleted$ = this._oes.currentOntologyCanBeDeleted$;
  project$ = this._store.select(ProjectsSelectors.currentProject);
  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  constructor(
    private _dialog: MatDialog,
    private _dialogService: DialogService,
    private _oes: OntologyEditService,
    private _router: Router,
    private _store: Store
  ) {}

  editOntology(ontology: ReadOntology | OntologyMetadata) {
    const data: UpdateOntologyData = {
      id: ontology.id,
      label: ontology.label,
      comment: ontology.comment || '',
    };
    this._dialog.open<OntologyFormComponent, UpdateOntologyData>(
      OntologyFormComponent,
      DspDialogConfig.dialogDrawerConfig(data, true)
    );
  }

  deleteOntology(ontologyId: string) {
    this._dialogService
      .afterConfirmation('Do you want to delete this data model ?')
      .pipe(
        switchMap(_del => this._oes.deleteOntology$(ontologyId)),
        take(1)
      )
      .subscribe(() => {
        this.navigateToDataModels();
      });
  }

  navigateToDataModels() {
    const projectUuid = this._store.selectSnapshot(ProjectsSelectors.currentProjectsUuid);
    this._router.navigate([RouteConstants.project, projectUuid, RouteConstants.dataModels]);
  }
}
