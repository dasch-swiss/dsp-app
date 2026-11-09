import { createEnvironmentInjector, EnvironmentInjector, inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { AvailableProperties, DataModelEditor, TextsToSave } from '@dasch-swiss/vre/pages/project/project';
import { DefaultProperty, LocalizationService, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { combineLatest, filter, finalize, map, Observable, switchMap, take, takeUntil } from 'rxjs';
import { OntologyEditService } from '../services/ontology-edit.service';
import { EditPropertyFormDialogComponent } from './property-form/edit-property-form-dialog.component';
import { CreatePropertyDialogData, EditPropertyDialogData } from './property-form/property-form.type';
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
  private readonly _localization = inject(LocalizationService);

  editClass(classIri: string): Observable<boolean> {
    return this._withEditing(classIri, (editing, injector) =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
        take(1),
        switchMap(ontology => {
          const resourceClass = ontology!.classes[classIri] as ResourceClassDefinitionWithAllLanguages;
          return this._closedByClickOnly(
            this._dialog.open<EditResourceClassDialogComponent, EditResourceClassDialogProps, UpdateResourceClassData>(
              EditResourceClassDialogComponent,
              {
                ...DspDialogConfig.mediumDialog({
                  labels: resourceClass.labels,
                  data: resourceClass as unknown as UpdateResourceClassData,
                }),
                injector,
              }
            )
          );
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
          return this._closedByClickOnly(
            this._dialog.open(EditPropertyFormDialogComponent, {
              ...DspDialogConfig.dialogDrawerConfig(data),
              injector,
            })
          );
        })
      )
    );
  }

  saveClassTexts(classIri: string, { labels, descriptions }: TextsToSave): Observable<boolean> {
    return this._withEditing(classIri, editing =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
        take(1),
        switchMap(() => editing.updateResourceClass$({ id: classIri, labels, comments: descriptions })),
        map(() => true)
      )
    );
  }

  savePropertyTexts(propertyIri: string, { labels, descriptions }: TextsToSave): Observable<boolean> {
    return this._withEditing(propertyIri, editing =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.properties[propertyIri]),
        take(1),
        switchMap(() => editing.updateProperty$({ id: propertyIri, labels, comment: descriptions })),
        map(() => true)
      )
    );
  }

  availableProperties(classIri: string): Observable<AvailableProperties[]> {
    const stringify = new StringifyStringLiteralPipe(this._localization);
    const injector = createEnvironmentInjector([OntologyEditService], this._injector);
    const editing = injector.get(OntologyEditService);
    editing.initOntologyByLabel(OntologyService.getOntologyNameFromIri(classIri.split('#')[0]));
    return combineLatest([editing.currentOntology$, editing.currentProjectsProperties$]).pipe(
      filter(([ontology]) => !!ontology?.classes[classIri]),
      take(1),
      map(([ontology, properties]) => {
        const used = new Set(ontology!.classes[classIri].propertiesList.map(property => property.propertyIndex));
        const byOntology = new Map<string, AvailableProperties>();
        for (const property of properties) {
          if (used.has(property.propDef.id)) continue;
          const group = byOntology.get(property.baseOntologyId) ?? {
            ontologyLabel: property.baseOntologyLabel,
            properties: [],
          };
          group.properties.push({
            iri: property.propDef.id,
            label: stringify.transform(property.propDef.labels) || property.propDef.label || '',
            icon: property.propType?.icon ?? 'label',
            description: stringify.transform(property.propDef.comments) || '',
          });
          byOntology.set(property.baseOntologyId, group);
        }
        return [...byOntology.values()].map(group => ({
          ...group,
          properties: group.properties.sort((a, b) => a.label.localeCompare(b.label)),
        }));
      }),
      finalize(() => injector.destroy())
    );
  }

  addExistingProperty(classIri: string, propertyIri: string): Observable<boolean> {
    return this._withEditing(classIri, editing =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
        take(1),
        switchMap(ontology => {
          editing.assignPropertyToClass(propertyIri, ontology!.classes[classIri]);
          // Saved once the data model, read again, gives the class the property.
          return editing.currentOntology$.pipe(
            filter(
              read => !!read?.classes[classIri]?.propertiesList.some(property => property.propertyIndex === propertyIri)
            ),
            take(1)
          );
        }),
        map(() => true)
      )
    );
  }

  addNewProperty(classIri: string, type: DefaultProperty): Observable<boolean> {
    return this._withEditing(classIri, (editing, injector) =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
        take(1),
        switchMap(ontology =>
          this._closedByClickOnly(
            this._dialog.open<EditPropertyFormDialogComponent, CreatePropertyDialogData>(
              EditPropertyFormDialogComponent,
              { data: { propType: type, assignToClass: ontology!.classes[classIri] }, injector }
            )
          )
        ),
        // The dialog closes without a result either way; the project is read again to show a property created.
        map(() => true)
      )
    );
  }

  /**
   * An edit dialog Esc leaves open, so the Esc that closes the Data models 2 pages' side panels never drops an edit
   * by mistake; a click beside it still closes it. Emits once it closes.
   */
  private _closedByClickOnly<T, R>(ref: MatDialogRef<T, R>): Observable<R | undefined> {
    ref.disableClose = true;
    ref
      .backdropClick()
      .pipe(takeUntil(ref.afterClosed()))
      .subscribe(() => ref.close());
    return ref.afterClosed();
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
