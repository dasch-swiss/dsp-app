import { createEnvironmentInjector, EnvironmentInjector, inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  ApiResponseError,
  CanDoResponse,
  Cardinality,
  KnoraApiConnection,
  ListInfoResponse,
  ListResponse,
  ResourceClassDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken, DspDialogConfig } from '@dasch-swiss/vre/core/config';
import {
  CreateListItemDialogComponent,
  CreateListItemDialogProps,
  EditListItemDialogComponent,
  EditListItemDialogProps,
  ListInfoFormComponent,
} from '@dasch-swiss/vre/pages/ontology/list';
import {
  AvailableProperties,
  CanDo,
  DataModelEditor,
  ProjectPageService,
  TextsToSave,
  VocabularyValue,
} from '@dasch-swiss/vre/pages/project/project';
import {
  DefaultClass,
  DefaultProperty,
  LocalizationService,
  OntologyService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { MultiLanguages } from '@dasch-swiss/vre/ui/string-literal';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { DIALOG_LARGE, DialogService } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, filter, finalize, map, Observable, of, switchMap, take, takeUntil } from 'rxjs';
import { OntologyEditService } from '../services/ontology-edit.service';
import { EditPropertyFormDialogComponent } from './property-form/edit-property-form-dialog.component';
import { CreatePropertyDialogData, EditPropertyDialogData } from './property-form/property-form.type';
import { CreateResourceClassDialogComponent } from './resource-class-form/create-resource-class-dialog.component';
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
  private readonly _project = inject(ProjectPageService);
  private readonly _listApi = inject(ListApiService);
  private readonly _confirm = inject(DialogService);
  private readonly _translate = inject(TranslateService);
  private readonly _api = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _notification = inject(NotificationService);

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

  reorderProperties(classIri: string, propertyIris: string[]): Observable<boolean> {
    return this._withEditing(classIri, editing =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
        take(1),
        switchMap(ontology => {
          // The class's properties in form order; its own ones take the new order, in the places they had.
          const current = [...ontology!.classes[classIri].propertiesList].sort(
            (a, b) => (a.guiOrder ?? 0) - (b.guiOrder ?? 0)
          );
          const moved = new Set(propertyIris);
          const next = [...propertyIris];
          const ordered = current.map(property => {
            if (!moved.has(property.propertyIndex)) return property;
            return current.find(own => own.propertyIndex === next.shift())!;
          });
          const saved = ordered.map((property, index) => ({ ...property, guiOrder: index + 1 }));
          editing.updateGuiOrderOfClassProperties(classIri, saved);
          // Saved once the data model, read again, has the class's properties in that order.
          const order = (properties: { propertyIndex: string; guiOrder?: number }[]) =>
            properties
              .filter(property => moved.has(property.propertyIndex))
              .sort((a, b) => (a.guiOrder ?? 0) - (b.guiOrder ?? 0))
              .map(property => property.propertyIndex)
              .join(' ');
          return editing.currentOntology$.pipe(
            filter(
              read =>
                !!read?.classes[classIri] && order(read.classes[classIri].propertiesList) === propertyIris.join(' ')
            ),
            take(1)
          );
        }),
        map(() => true)
      )
    );
  }

  createClass(ontologyIri: string, kind: DefaultClass): Observable<string | undefined> {
    return this._created(ontologyIri, (editing, injector) =>
      this._closedByClickOnly(
        this._dialog.open<CreateResourceClassDialogComponent, DefaultClass, string>(
          CreateResourceClassDialogComponent,
          {
            ...DspDialogConfig.mediumDialog(kind),
            injector,
          }
        )
      )
    );
  }

  createProperty(ontologyIri: string, type: DefaultProperty): Observable<string | undefined> {
    return this._created(ontologyIri, (editing, injector) =>
      this._closedByClickOnly(
        this._dialog.open<EditPropertyFormDialogComponent, CreatePropertyDialogData, string>(
          EditPropertyFormDialogComponent,
          { data: { propType: type }, injector }
        )
      )
    );
  }

  /**
   * Opens a create dialog with an editing service on the data model, once it is read, dropped once the dialog closes;
   * emits the IRI of what was made, from the name the dialog closes with, or nothing if it was cancelled.
   */
  private _created(
    ontologyIri: string,
    open: (editing: OntologyEditService, injector: EnvironmentInjector) => Observable<string | undefined>
  ): Observable<string | undefined> {
    const injector = createEnvironmentInjector([OntologyEditService], this._injector);
    const editing = injector.get(OntologyEditService);
    editing.initOntologyByLabel(OntologyService.getOntologyNameFromIri(ontologyIri));
    return editing.currentOntology$.pipe(
      filter(ontology => !!ontology),
      take(1),
      switchMap(() => open(editing, injector)),
      map(name => (name ? `${ontologyIri}#${name}` : undefined)),
      finalize(() => injector.destroy())
    );
  }

  createVocabulary(): Observable<string | undefined> {
    return this._closedByClickOnly(
      this._dialog.open<ListInfoFormComponent, null, ListResponse | ListInfoResponse>(
        ListInfoFormComponent,
        DspDialogConfig.dialogDrawerConfig(null, true)
      )
    ).pipe(map(response => (response && 'list' in response ? response.list.listinfo.id : undefined)));
  }

  addVocabularyValue(parentIri: string, position: number): Observable<boolean> {
    return this._project.currentProject$.pipe(
      take(1),
      switchMap(project =>
        this._closedByClickOnly(
          this._dialog.open<CreateListItemDialogComponent, CreateListItemDialogProps, boolean>(
            CreateListItemDialogComponent,
            { ...DIALOG_LARGE, data: { nodeIri: parentIri, parentIri, projectIri: project.id, position } }
          )
        )
      ),
      map(added => added === true)
    );
  }

  editVocabularyValue(value: VocabularyValue): Observable<boolean> {
    return this._project.currentProject$.pipe(
      take(1),
      switchMap(project =>
        this._closedByClickOnly(
          this._dialog.open<EditListItemDialogComponent, EditListItemDialogProps, boolean>(
            EditListItemDialogComponent,
            DspDialogConfig.dialogDrawerConfig(
              {
                nodeIri: value.id,
                projectIri: project.id,
                formData: {
                  labels: value.labels as MultiLanguages,
                  comments: (value.comments ?? []) as MultiLanguages,
                },
              },
              true
            )
          )
        )
      ),
      map(saved => saved === true)
    );
  }

  deleteVocabularyValue(value: VocabularyValue): Observable<boolean> {
    return this._confirm
      .afterConfirmation(
        this._translate.instant('pages.ontology.list.actionBubble.deleteNode'),
        new StringifyStringLiteralPipe(this._localization).transform(value.labels as MultiLanguages)
      )
      .pipe(
        switchMap(() => this._listApi.deleteListNode(value.id)),
        map(() => true)
      );
  }

  moveVocabularyValue(valueIri: string, parentIri: string, position: number): Observable<boolean> {
    return this._listApi.repositionChildNode(valueIri, { parentNodeIri: parentIri, position }).pipe(map(() => true));
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

  canDeleteClass(classIri: string): Observable<CanDo> {
    return this._canDo(this._api.v2.onto.canDeleteResourceClass(classIri));
  }

  deleteClass(classIri: string, label: string): Observable<boolean> {
    return this._confirm
      .afterConfirmation(this._translate.instant('pages.dataModels2.deleteClassConfirm', { class: label }))
      .pipe(
        switchMap(() =>
          this._withEditing(classIri, editing =>
            editing.currentOntology$.pipe(
              filter(ontology => !!ontology?.classes[classIri]),
              take(1),
              switchMap(() => editing.deleteResourceClass$(classIri)),
              map(() => true)
            )
          )
        )
      );
  }

  removeProperty(
    classIri: string,
    propertyIri: string,
    labels: { property: string; class: string }
  ): Observable<boolean> {
    return this._withEditing(classIri, editing =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
        take(1),
        switchMap(ontology => {
          const card = ontology!.classes[classIri].propertiesList.find(
            property => property.propertyIndex === propertyIri
          );
          if (!card) return of(false);
          return editing.propertyCanBeRemovedFromClass$(card, classIri).pipe(
            switchMap(check => {
              if (!check.canDo) {
                this._notify(this._translate.instant('pages.dataModels2.cannotRemove', labels), check.cannotDoReason);
                return of(false);
              }
              return this._confirm
                .afterConfirmation(this._translate.instant('pages.dataModels2.removeFromClassConfirm', labels))
                .pipe(
                  switchMap(() => {
                    editing.removePropertyFromClass(card, classIri);
                    // Saved once the data model, read again, no longer gives the class the property.
                    return editing.currentOntology$.pipe(
                      filter(
                        read =>
                          !!read?.classes[classIri] &&
                          !read.classes[classIri].propertiesList.some(
                            property => property.propertyIndex === propertyIri
                          )
                      ),
                      take(1),
                      map(() => true)
                    );
                  })
                );
            })
          );
        })
      )
    );
  }

  canDeleteProperty(propertyIri: string): Observable<CanDo> {
    return this._canDo(this._api.v2.onto.canDeleteResourceProperty(propertyIri));
  }

  deleteProperty(propertyIri: string, label: string): Observable<boolean> {
    return this.canDeleteProperty(propertyIri).pipe(
      switchMap(check => {
        if (!check.canDo) {
          this._notify(
            this._translate.instant('pages.dataModels2.cannotDeleteProperty', { property: label }),
            check.reason
          );
          return of(false);
        }
        return this._confirm
          .afterConfirmation(this._translate.instant('pages.dataModels2.deletePropertyConfirm', { property: label }))
          .pipe(
            switchMap(() =>
              this._withEditing(propertyIri, editing =>
                editing.currentOntology$.pipe(
                  filter(ontology => !!ontology?.properties[propertyIri]),
                  take(1),
                  switchMap(() => editing.deleteProperty$(propertyIri)),
                  map(() => true)
                )
              )
            )
          );
      })
    );
  }

  canSetCardinality(classIri: string, propertyIri: string, cardinality: Cardinality): Observable<CanDo> {
    return this._canDo(this._api.v2.onto.canReplaceCardinalityOfResourceClassWith(classIri, propertyIri, cardinality));
  }

  setCardinality(classIri: string, propertyIri: string, cardinality: Cardinality): Observable<boolean> {
    return this._withEditing(classIri, editing =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology?.classes[classIri]),
        take(1),
        switchMap(ontology => {
          // The class's own properties, as the API replaces them all; this one with its new cardinality.
          const own = ontology!.classes[classIri].propertiesList.filter(property => !property.isInherited);
          if (!own.some(property => property.propertyIndex === propertyIri)) return of(false);
          editing.updatePropertiesOfResourceClass(
            classIri,
            own.map(property => (property.propertyIndex === propertyIri ? { ...property, cardinality } : property))
          );
          return editing.currentOntology$.pipe(
            filter(
              read =>
                read?.classes[classIri]?.propertiesList.find(property => property.propertyIndex === propertyIri)
                  ?.cardinality === cardinality
            ),
            take(1),
            map(() => true)
          );
        })
      )
    );
  }

  /** Whether the API allows it, and why not; an error answer counts as not, with its message. */
  private _canDo(check: Observable<CanDoResponse | ApiResponseError>): Observable<CanDo> {
    return check.pipe(
      take(1),
      map(response =>
        response instanceof ApiResponseError
          ? { canDo: false, reason: response.error instanceof Error ? response.error.message : String(response.error) }
          : { canDo: response.canDo, reason: response.cannotDoReason }
      ),
      catchError(() => of({ canDo: false }))
    );
  }

  /** Says why an action could not be done, with the API's reason when there is one. */
  private _notify(message: string, reason?: string): void {
    this._notification.openSnackBar(reason ? `${message} ${reason}` : message, 'error');
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
