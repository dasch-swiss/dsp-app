import { createEnvironmentInjector, EnvironmentInjector, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { DataModelEditor, LanguageText } from '@dasch-swiss/vre/pages/project/project';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { filter, finalize, map, Observable, switchMap, take } from 'rxjs';
import { OntologyEditService } from '../services/ontology-edit.service';
import { EditPropertyFormDialogComponent } from './property-form/edit-property-form-dialog.component';
import { EditPropertyDialogData } from './property-form/property-form.type';
import {
  EditResourceClassDialogComponent,
  EditResourceClassDialogProps,
} from './resource-class-form/edit-resource-class-dialog.component';
import { UpdateResourceClassData } from './resource-class-form/resource-class-form.type';

/**
 * Opens the data model editor's "Customize resource class" and "Edit property" dialogs away from it, as on the Data
 * models 2 pages: each dialog gets an editing service of its own, on the data model of what it edits, dropped once it
 * closes.
 */
@Injectable()
export class DataModelEditorService implements DataModelEditor {
  private readonly _dialog = inject(MatDialog);
  private readonly _injector = inject(EnvironmentInjector);

  editClass(classIri: string): Observable<boolean> {
    return this._withEditing(classIri, (editing, injector) =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
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
        })
      )
    );
  }

  editProperty(propertyIri: string): Observable<boolean> {
    return this._withEditing(propertyIri, (editing, injector) =>
      editing.currentOntologyProperties$.pipe(
        map(properties => properties.find(property => property.propDef.id === propertyIri)),
        filter(property => !!property),
        take(1),
        switchMap(property => {
          const { propDef, propType } = property!;
          const data: EditPropertyDialogData = {
            id: propDef.id,
            propType,
            name: propDef.id.split('#').pop() ?? '',
            label: propDef.labels,
            comment: propDef.comments,
            guiElement: propDef.guiElement || propType.guiElement,
            guiAttribute: propDef.guiAttributes[0],
            objectType: propDef.objectType,
          };
          return this._dialog
            .open(EditPropertyFormDialogComponent, { ...DspDialogConfig.dialogDrawerConfig(data), injector })
            .afterClosed();
        })
      )
    );
  }

  saveClassDescriptions(classIri: string, descriptions: LanguageText[]): Observable<boolean> {
    return this._withEditing(classIri, editing =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
        take(1),
        switchMap(() => editing.updateResourceClass$({ id: classIri, comments: descriptions })),
        map(() => true)
      )
    );
  }

  /** Runs `open` with an editing service on the data model of `iri`, dropped once the dialog closes. */
  private _withEditing(
    iri: string,
    open: (editing: OntologyEditService, injector: EnvironmentInjector) => Observable<unknown>
  ): Observable<boolean> {
    const injector = createEnvironmentInjector([OntologyEditService], this._injector);
    const editing = injector.get(OntologyEditService);
    editing.initOntologyByLabel(OntologyService.getOntologyNameFromIri(iri.split('#')[0]));
    return open(editing, injector).pipe(
      map(saved => !!saved),
      finalize(() => injector.destroy())
    );
  }
}
