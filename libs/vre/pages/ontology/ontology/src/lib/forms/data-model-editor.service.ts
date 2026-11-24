import { createEnvironmentInjector, EnvironmentInjector, inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ApiResponseError,
  CanDoResponse,
  Cardinality,
  KnoraApiConnection,
  ListInfoResponse,
  ListResponse,
  OntologyMetadata,
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
import {
  catchError,
  combineLatest,
  concatMap,
  defaultIfEmpty,
  EMPTY,
  filter,
  finalize,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { OntologyEditService } from '../services/ontology-edit.service';
import { CreateOntologyFormDialogComponent } from './ontology-form/create-ontology-form-dialog.component';
import { EditOntologyFormDialogComponent } from './ontology-form/edit-ontology-form-dialog.component';
import { UpdateOntologyData } from './ontology-form/ontology-form.type';
import { EditPropertyFormDialogComponent } from './property-form/edit-property-form-dialog.component';
import { CreatePropertyDialogData, EditPropertyDialogData } from './property-form/property-form.type';
import { CreateResourceClassDialogComponent } from './resource-class-form/create-resource-class-dialog.component';
import {
  EditResourceClassDialogComponent,
  EditResourceClassDialogProps,
} from './resource-class-form/edit-resource-class-dialog.component';
import { UpdateResourceClassData } from './resource-class-form/resource-class-form.type';

/** The words for each cardinality, under `pages.dataModels2.cardinality`. */
const CARDINALITY_KEYS: Record<Cardinality, string> = {
  [Cardinality._1]: 'requiredOne',
  [Cardinality._0_1]: 'optionalOne',
  [Cardinality._1_n]: 'requiredMultiple',
  [Cardinality._0_n]: 'optionalMultiple',
};

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
  private readonly _snackBar = inject(MatSnackBar);
  /**
   * Cardinality saves, one after another: each reads the data model as the one before left it, since the API turns a
   * change made from an older reading away as made by another user.
   */
  private readonly _saves = new Subject<() => Observable<unknown>>();

  constructor() {
    // Lives as long as the service; a failed save does not stop the ones after it.
    this._saves.pipe(concatMap(save => save().pipe(catchError(() => EMPTY)))).subscribe();
  }

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
        switchMap(property =>
          editing.currentOntology$.pipe(
            take(1),
            map(ontology => ({ property, ontology }))
          )
        ),
        switchMap(({ property, ontology }) => {
          const { propDef, propType } = property!;
          const usedBy = Object.values(ontology?.classes ?? {})
            .filter(resourceClass => resourceClass.propertiesList.some(card => card.propertyIndex === propertyIri))
            .map(resourceClass => resourceClass.label ?? resourceClass.id.split('#').pop()!);
          const data: EditPropertyDialogData = {
            id: propDef.id,
            propType,
            name: propDef.id.split('#').pop() ?? '',
            label: propDef.labels,
            comment: propDef.comments,
            guiElement: propDef.guiElement || propType.guiElement,
            guiAttribute: propDef.guiAttributes[0],
            objectType: propDef.objectType,
            usedBy,
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
        // Whether a superclass of the class, at any depth in this data model, is among `classes`.
        const hasAncestorIn = (iri: string, classes: Set<string>, seen = new Set<string>()): boolean =>
          (ontology!.classes[iri]?.subClassOf ?? []).some(
            parent => !seen.has(parent) && (classes.has(parent) || hasAncestorIn(parent, classes, seen.add(parent)))
          );
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
            name: property.propDef.id.substring(property.propDef.id.lastIndexOf('#') + 1),
            isLink: property.propDef.isLinkProperty,
            type: property.propDef.isLinkProperty
              ? stringify.transform(property.objectLabels) ||
                (property.propDef.objectType ?? '').substring((property.propDef.objectType ?? '').lastIndexOf('#') + 1)
              : (property.propType?.label ?? ''),
            // The topmost classes using it: their subclasses, which have it too, would only repeat them.
            usedBy: property.usedByClasses
              .filter(used => !hasAncestorIn(used.id, new Set(property.usedByClasses.map(other => other.id))))
              .map(used => stringify.transform(used.labels))
              .filter(Boolean),
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

  /** Gives the class an existing property, after any save still running; emits whether it was saved. */
  addExistingProperty(classIri: string, propertyIri: string): Observable<boolean> {
    return this._serially(() =>
      this._withEditing(classIri, editing =>
        editing.currentOntology$.pipe(
          filter(ontology => !!ontology?.classes[classIri]),
          take(1),
          switchMap(ontology => this._saved(editing.assignPropertyToClass$(propertyIri, ontology!.classes[classIri])))
        )
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
            this._dialog.open<EditPropertyFormDialogComponent, CreatePropertyDialogData, string>(
              EditPropertyFormDialogComponent,
              { data: { propType: type, assignToClass: ontology!.classes[classIri] }, injector }
            )
          )
        ),
        // The dialog closes with the new property's name once it exists, but the class gets it only after: saved
        // once the data model, read again, gives the class the property; nothing to wait for when cancelled.
        switchMap(name => {
          if (!name) return of(false);
          const propertyIri = `${classIri.split('#')[0]}#${name}`;
          return editing.currentOntology$.pipe(
            filter(
              read => !!read?.classes[classIri]?.propertiesList.some(property => property.propertyIndex === propertyIri)
            ),
            take(1),
            map(() => true)
          );
        })
      )
    );
  }

  /** Saves the form order of the class's own properties, after any save still running; emits whether it was saved. */
  reorderProperties(classIri: string, propertyIris: string[]): Observable<boolean> {
    return this._serially(() =>
      this._withEditing(classIri, editing =>
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
            return this._saved(editing.updateGuiOrderOfClassProperties$(classIri, saved));
          })
        )
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

  createDataModel(): Observable<string | undefined> {
    return this._closedByClickOnly(
      this._dialog.open<CreateOntologyFormDialogComponent, null, OntologyMetadata>(
        CreateOntologyFormDialogComponent,
        DspDialogConfig.dialogDrawerConfig(null, true)
      )
    ).pipe(map(ontology => ontology?.id));
  }

  editDataModel(model: { iri: string; label: string; comment?: string }): Observable<boolean> {
    return this._withEditing(model.iri, (editing, injector) =>
      editing.currentOntology$.pipe(
        filter(ontology => !!ontology),
        take(1),
        switchMap(() =>
          this._closedByClickOnly(
            this._dialog.open<EditOntologyFormDialogComponent, UpdateOntologyData, OntologyMetadata>(
              EditOntologyFormDialogComponent,
              {
                ...DspDialogConfig.dialogDrawerConfig(
                  { id: model.iri, label: model.label, comment: model.comment ?? '' },
                  true
                ),
                injector,
              }
            )
          )
        )
      )
    );
  }

  canDeleteDataModel(ontologyIri: string): Observable<CanDo> {
    return this._canDo(this._api.v2.onto.canDeleteOntology(ontologyIri));
  }

  deleteDataModel(ontologyIri: string, label: string): Observable<boolean> {
    return this._confirm
      .afterConfirmation(this._translate.instant('pages.dataModels2.deleteDataModelConfirm', { model: label }))
      .pipe(
        switchMap(() =>
          this._withEditing(ontologyIri, editing =>
            editing.currentOntology$.pipe(
              filter(ontology => !!ontology),
              take(1),
              switchMap(() => editing.deleteOntology$(ontologyIri)),
              map(() => true)
            )
          )
        )
      );
  }

  canDeleteClass(classIri: string): Observable<CanDo> {
    return this._canDo(this._api.v2.onto.canDeleteResourceClass(classIri));
  }

  /** Deletes the class once the API allows it and the user confirms; emits whether it was deleted. */
  deleteClass(classIri: string, label: string): Observable<boolean> {
    return this.canDeleteClass(classIri).pipe(
      switchMap(check => {
        if (!check.canDo) {
          this._notify(this._translate.instant('pages.dataModels2.cannotDeleteClass'), check.reason);
          return of(false);
        }
        return this._confirm
          .afterConfirmation(this._translate.instant('pages.dataModels2.deleteClassConfirm', { class: label }))
          .pipe(
            switchMap(() =>
              this._withEditing(classIri, editing =>
                editing.currentOntology$.pipe(
                  filter(ontology => !!ontology?.classes[classIri]),
                  take(1),
                  switchMap(() => this._saved(editing.deleteResourceClass$(classIri)))
                )
              )
            )
          );
      })
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
                // With a reason, the API said why. Without one, values are in the way: how many, the count tells.
                if (check.cannotDoReason) {
                  this._notify(this._translate.instant('pages.dataModels2.cannotRemove', labels), check.cannotDoReason);
                  return of(false);
                }
                return this._valuesInTheWay(classIri, propertyIri).pipe(
                  map(count => {
                    this._notification.openSnackBar(this._cannotRemoveMessage(labels, count), 'error');
                    return false;
                  })
                );
              }
              return this._confirm
                .afterConfirmation(this._translate.instant('pages.dataModels2.removeFromClassConfirm', labels))
                .pipe(
                  // Saved from the data model as read once the saves before it are done, so its date is current.
                  switchMap(() =>
                    this._serially(() =>
                      this._withEditing(classIri, current =>
                        current.currentOntology$.pipe(
                          filter(ontology => !!ontology?.classes[classIri]),
                          take(1),
                          switchMap(() => this._saved(current.removePropertyFromClass$(card, classIri)))
                        )
                      )
                    )
                  )
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

  /**
   * Gives the class's property that cardinality once the user confirms, after any save still running, then offers to
   * undo it. Emits whether it
   * was saved; the API's refusal shows as its message, and emits false.
   */
  setCardinality(classIri: string, propertyIri: string, cardinality: Cardinality): Observable<boolean> {
    return this._saveCardinality(classIri, propertyIri, cardinality, true);
  }

  private _saveCardinality(
    classIri: string,
    propertyIri: string,
    cardinality: Cardinality,
    offerUndo: boolean
  ): Observable<boolean> {
    return this._serially(() =>
      this._withEditing(classIri, editing =>
        editing.currentOntology$.pipe(
          filter(ontology => !!ontology?.classes[classIri]),
          take(1),
          switchMap(ontology => {
            // The class's own properties, as the API replaces them all, and this one with its new cardinality. An
            // inherited one becomes the class's own then, as a subclass may hold a property more strictly.
            const list = ontology!.classes[classIri].propertiesList;
            const target = list.find(property => property.propertyIndex === propertyIri);
            const previous = target?.cardinality;
            if (!target || previous === undefined) return of(false);
            const own = list.filter(property => !property.isInherited || property === target);
            if (previous === cardinality) return of(true);
            const labels = {
              property: ontology!.properties[propertyIri]?.label || propertyIri.split('#').pop()!,
              class: ontology!.classes[classIri].label || classIri.split('#').pop()!,
            };
            // Saved only once the API says the existing resources allow it.
            return this.canSetCardinality(classIri, propertyIri, cardinality).pipe(
              switchMap(check => {
                if (!check.canDo) {
                  this._notify(this._translate.instant('pages.dataModels2.cardinalityBlocked'), check.reason);
                  return of(false);
                }
                const save = () =>
                  this._saved(
                    editing.replacePropertiesOfResourceClass$(
                      classIri,
                      own.map(property =>
                        property === target ? { ...property, cardinality, isInherited: false } : property
                      )
                    )
                  );
                // Undo saves at once; a change of the user's own is asked first, and cancelling it saves nothing.
                if (!offerUndo) return save();
                const r = 'pages.dataModels2';
                return this._confirm
                  .afterConfirmation(
                    this._translate.instant(`${r}.cardinalityConfirm`, {
                      ...labels,
                      cardinality: this._translate.instant(`${r}.cardinality.${CARDINALITY_KEYS[cardinality]}`),
                    })
                  )
                  .pipe(switchMap(save), defaultIfEmpty(false));
              }),
              tap(saved => {
                if (saved && offerUndo) this._offerUndo(classIri, propertyIri, previous, cardinality, labels);
              })
            );
          })
        )
      )
    );
  }

  /** Says what the cardinality now is, with Undo, which saves the one before and reads the project again. */
  private _offerUndo(
    classIri: string,
    propertyIri: string,
    previous: Cardinality,
    cardinality: Cardinality,
    labels: { property: string; class: string }
  ): void {
    const r = 'pages.dataModels2';
    const message = this._translate.instant(`${r}.cardinalitySaved`, {
      ...labels,
      cardinality: this._translate.instant(`${r}.cardinality.${CARDINALITY_KEYS[cardinality]}`),
    });
    this._snackBar
      .open(message, this._translate.instant(`${r}.undo`), { duration: 8000, verticalPosition: 'top' })
      .onAction()
      .pipe(switchMap(() => this._saveCardinality(classIri, propertyIri, previous, false)))
      .subscribe(saved => saved && this._project.reloadProject());
  }

  /** Whether a write went through: false on the API's error, whose message the app shows already. */
  private _saved(write: Observable<unknown>): Observable<boolean> {
    return write.pipe(
      map(response => !(response instanceof ApiResponseError)),
      catchError(() => of(false))
    );
  }

  /** Runs `save` once the saves queued before it are done, emitting what it emits. */
  private _serially<T>(save: () => Observable<T>): Observable<T> {
    return new Observable<T>(subscriber => {
      this._saves.next(() => save().pipe(tap(subscriber)));
    });
  }

  /** Whether the API allows it, and why not; an error is a failed check, not an answer, with its message. */
  private _canDo(check: Observable<CanDoResponse | ApiResponseError>): Observable<CanDo> {
    const failed = (reason?: string): CanDo => ({ canDo: false, failed: true, reason });
    return check.pipe(
      take(1),
      map(response =>
        response instanceof ApiResponseError
          ? failed(response.error instanceof Error ? response.error.message : String(response.error))
          : { canDo: response.canDo, reason: response.cannotDoReason }
      ),
      catchError(() => of(failed()))
    );
  }

  /**
   * How many resources of the class, or of its subclasses, have a value for the property, as the viewer can see
   * them: deleted values and resources are not counted. Undefined when the count fails.
   */
  private _valuesInTheWay(classIri: string, propertyIri: string): Observable<number | undefined> {
    const query = `PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT { ?resource knora-api:isMainResource true . } WHERE {
  ?resource a knora-api:Resource .
  ?resource a <${classIri}> .
  ?resource <${propertyIri}> ?value .
}`;
    return this._api.v2.search.doExtendedSearchCountQuery(query).pipe(
      take(1),
      map(response => (response instanceof ApiResponseError ? undefined : response.numberOfResults)),
      catchError(() => of(undefined))
    );
  }

  /**
   * Why a property cannot be removed from a class: so many resources still have a value for it, or, when none the
   * viewer can see does, values marked as deleted or hidden from the viewer, which only DaSCH can erase.
   */
  private _cannotRemoveMessage(labels: { property: string; class: string }, count: number | undefined): string {
    const r = 'pages.dataModels2';
    if (count === undefined) return this._translate.instant(`${r}.cannotRemove`, labels);
    if (count === 0) return this._translate.instant(`${r}.cannotRemoveHiddenValues`, labels);
    const formatted = count.toLocaleString(this._translate.currentLang);
    return this._translate.instant(count === 1 ? `${r}.cannotRemoveOneValue` : `${r}.cannotRemoveValues`, {
      ...labels,
      count: formatted,
    });
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
