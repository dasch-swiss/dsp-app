import { createEnvironmentInjector, EnvironmentInjector, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { ClassEditor } from '@dasch-swiss/vre/pages/project/project';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { filter, finalize, map, Observable, switchMap, take } from 'rxjs';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { EditResourceClassDialogComponent, EditResourceClassDialogProps } from './edit-resource-class-dialog.component';
import { UpdateResourceClassData } from './resource-class-form.type';

/**
 * Opens the "Customize resource class" dialog of the data model editor away from it, as on the Data models 2 pages:
 * the dialog gets an editing service of its own, on the class's data model, dropped once it closes.
 */
@Injectable()
export class ResourceClassEditorService implements ClassEditor {
  private readonly _dialog = inject(MatDialog);
  private readonly _injector = inject(EnvironmentInjector);

  edit(classIri: string): Observable<boolean> {
    const injector = createEnvironmentInjector([OntologyEditService], this._injector);
    const editing = injector.get(OntologyEditService);
    const [ontologyIri] = classIri.split('#');
    editing.initOntologyByLabel(OntologyService.getOntologyNameFromIri(ontologyIri));
    return editing.currentOntology$.pipe(
      filter(ontology => ontology?.id === ontologyIri),
      take(1),
      switchMap(ontology => {
        const resourceClass = ontology!.classes[classIri] as ResourceClassDefinitionWithAllLanguages;
        return this._dialog
          .open<EditResourceClassDialogComponent, EditResourceClassDialogProps, UpdateResourceClassData>(
            EditResourceClassDialogComponent,
            {
              ...DspDialogConfig.mediumDialog({
                labels: resourceClass.labels,
                data: resourceClass as unknown as UpdateResourceClassData,
              }),
              injector,
            }
          )
          .afterClosed();
      }),
      map(saved => !!saved),
      finalize(() => injector.destroy())
    );
  }
}
