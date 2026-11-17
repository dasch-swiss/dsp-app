import { DestroyRef, inject, InjectionToken } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { DefaultClass, DefaultProperty, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { filter, map, Observable, of, tap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { LanguageText } from '../sidenav/data-model-map/data-model-graph';

/**
 * Edits a class or a property of a data model in place, in the data model editor's dialogs. Those dialogs belong to
 * the ontology pages, which depend on this library, so the app provides them here; see `app.routes.ts`.
 */
export interface DataModelEditor {
  /** Opens the class's dialog, for its labels and description; emits once it closes, `true` if it was saved. */
  editClass(classIri: string): Observable<boolean>;
  /** Opens the property's dialog, for its labels and description; emits once it closes, `true` if it was saved. */
  editProperty(propertyIri: string): Observable<boolean>;
  /** Saves the class's labels or description, every language at once; emits `true` once saved. */
  saveClassTexts(classIri: string, texts: TextsToSave): Observable<boolean>;
  /** Saves the property's labels or description, every language at once; emits `true` once saved. */
  savePropertyTexts(propertyIri: string, texts: TextsToSave): Observable<boolean>;
  /** The project's properties the class does not have yet, by data model. */
  availableProperties(classIri: string): Observable<AvailableProperties[]>;
  /** Gives the class an existing property, optional and single; emits `true` once saved. */
  addExistingProperty(classIri: string, propertyIri: string): Observable<boolean>;
  /** Opens the dialog creating a property of that type for the class; emits once it closes, `true` if it may have saved. */
  addNewProperty(classIri: string, type: DefaultProperty): Observable<boolean>;
  /**
   * Saves the form order of the class's own properties, as `propertyIris` lists them; inherited ones keep their places.
   * Emits `true` once saved.
   */
  reorderProperties(classIri: string, propertyIris: string[]): Observable<boolean>;
  /** Whether the class can be deleted: no resources, subclasses or links use it. */
  canDeleteClass(classIri: string): Observable<CanDo>;
  /** Asks to confirm, then deletes the class; `true` once deleted. */
  deleteClass(classIri: string, label: string): Observable<boolean>;
  /**
   * Checks whether the class can lose the property, saying why not, then asks to confirm and removes it; the property
   * stays in the data model. `true` once removed.
   */
  removeProperty(
    classIri: string,
    propertyIri: string,
    labels: { property: string; class: string }
  ): Observable<boolean>;
  /** Whether the property can be deleted: no class or value uses it. */
  canDeleteProperty(propertyIri: string): Observable<CanDo>;
  /** Checks whether the property can be deleted, saying why not, then asks to confirm and deletes it; `true` once deleted. */
  deleteProperty(propertyIri: string, label: string): Observable<boolean>;
  /**
   * Checks which of the properties can be deleted, saying how many cannot, then asks once to confirm and deletes the
   * others; `true` once deleted.
   */
  deleteProperties(properties: { iri: string; label: string }[]): Observable<boolean>;
  /** Whether the class's property can take that cardinality, given the resources there are. */
  canSetCardinality(classIri: string, propertyIri: string, cardinality: Cardinality): Observable<CanDo>;
  /** Gives the class's property that cardinality; `true` once saved. */
  setCardinality(classIri: string, propertyIri: string, cardinality: Cardinality): Observable<boolean>;
  /** Opens the dialog creating a class of that kind in the data model; emits once it closes, the new class's IRI if made. */
  createClass(ontologyIri: string, kind: DefaultClass): Observable<string | undefined>;
  /** Opens the dialog creating a property of that type in the data model, for no class yet; emits its IRI if made. */
  createProperty(ontologyIri: string, type: DefaultProperty): Observable<string | undefined>;
  /** Opens the dialog creating a controlled vocabulary in the project; emits the new vocabulary's IRI if made. */
  createVocabulary(): Observable<string | undefined>;
  /** Opens the dialog adding a value to a controlled vocabulary, under `parentIri` at `position`; `true` once added. */
  addVocabularyValue(parentIri: string, position: number): Observable<boolean>;
  /** Opens the dialog editing a vocabulary value's labels and descriptions; `true` once saved. */
  editVocabularyValue(value: VocabularyValue): Observable<boolean>;
  /** Asks to confirm, then deletes a vocabulary value with every value under it; `true` once deleted. */
  deleteVocabularyValue(value: VocabularyValue): Observable<boolean>;
  /** Moves a vocabulary value to `position` among the values of `parentIri`; `true` once moved. */
  moveVocabularyValue(valueIri: string, parentIri: string, position: number): Observable<boolean>;
}

/** Whether an action is possible, and if not, the API's reason. */
export interface CanDo {
  canDo: boolean;
  reason?: string;
}

/** A value of a controlled vocabulary, as the editor's dialogs take it. */
export interface VocabularyValue {
  id: string;
  labels: { value: string; language?: string }[];
  comments?: { value: string; language?: string }[];
}

/** Properties a class could be given, from one data model of the project. */
export interface AvailableProperties {
  ontologyLabel: string;
  properties: {
    iri: string;
    label: string;
    icon: string;
    description: string;
    /** Its name in the data model, such as `hasYear`. */
    name: string;
    /** For a link, the label of the class it points at; else the label of its value type. */
    type: string;
    isLink: boolean;
    /** The labels of the classes that already use it: what tells same-named properties apart. */
    usedBy: string[];
  }[];
}

/** A class's or property's labels or description, in each language it has. */
export interface TextsToSave {
  labels?: LanguageText[];
  descriptions?: LanguageText[];
}

/** The data model editor, if the app provides one; without it, editing opens the data model editor page instead. */
export const DATA_MODEL_EDITOR = new InjectionToken<DataModelEditor>('DataModelEditor');

/**
 * Editing classes and properties from a component of the Data models 2 pages: in the editor's dialog when the app
 * provides it, a saved change then read again with the whole project so every section shows it; else on the data model
 * editor page. Call in an injection context.
 */
export function injectDataModelEditing() {
  const editor = inject(DATA_MODEL_EDITOR, { optional: true });
  const project = inject(ProjectPageService);
  const router = inject(Router);
  const destroyRef = inject(DestroyRef);
  const edit = (iri: string, page: string, inPlace?: (iri: string) => Observable<boolean>) => {
    if (inPlace) {
      inPlace(iri)
        .pipe(filter(Boolean), takeUntilDestroyed(destroyRef))
        .subscribe(() => project.reloadProject());
      return;
    }
    const [ontologyIri] = iri.split('#');
    router.navigate([
      '/',
      RouteConstants.project,
      project.currentProjectUuid,
      RouteConstants.ontology,
      OntologyService.getOntologyNameFromIri(ontologyIri),
      RouteConstants.editor,
      page,
    ]);
  };
  // A saved text is read again with the whole project, so every section shows it.
  const reloadOnceSaved = (saved: Observable<boolean>): Observable<boolean> =>
    saved.pipe(
      tap(done => done && project.reloadProject()),
      map(Boolean)
    );
  return {
    /** Whether labels and descriptions can be saved in place, without the data model editor's page. */
    canSaveInPlace: !!editor,
    /** Saves the class's labels or description. Emits `true` once saved. */
    saveClassTexts: (iri: string, texts: TextsToSave): Observable<boolean> =>
      editor ? reloadOnceSaved(editor.saveClassTexts(iri, texts)) : of(false),
    /** Saves the property's labels or description. Emits `true` once saved. */
    savePropertyTexts: (iri: string, texts: TextsToSave): Observable<boolean> =>
      editor ? reloadOnceSaved(editor.savePropertyTexts(iri, texts)) : of(false),
    /** The project's properties the class does not have yet; none without the editor. */
    availableProperties: (classIri: string): Observable<AvailableProperties[]> =>
      editor ? editor.availableProperties(classIri) : of([]),
    /** Gives the class an existing property, then reads the project again. */
    addExistingProperty: (classIri: string, propertyIri: string) =>
      editor && edit(classIri, RouteConstants.classes, () => editor.addExistingProperty(classIri, propertyIri)),
    /** Creates a property of that type for the class, in the data model editor's dialog, then reads the project again. */
    addNewProperty: (classIri: string, type: DefaultProperty) =>
      editor && edit(classIri, RouteConstants.classes, () => editor.addNewProperty(classIri, type)),
    /** Whether classes and properties can be deleted, and cardinalities changed, here. */
    canDelete: !!editor,
    canDeleteClass: (classIri: string): Observable<CanDo> =>
      editor ? editor.canDeleteClass(classIri) : of({ canDo: false }),
    /** Deletes the class once confirmed, then reads the project again. */
    deleteClass: (classIri: string, label: string): Observable<boolean> =>
      editor ? reloadOnceSaved(editor.deleteClass(classIri, label)) : of(false),
    /** Removes the property from the class once checked and confirmed, then reads the project again. */
    removeProperty: (classIri: string, propertyIri: string, labels: { property: string; class: string }) =>
      editor ? reloadOnceSaved(editor.removeProperty(classIri, propertyIri, labels)) : of(false),
    canDeleteProperty: (propertyIri: string): Observable<CanDo> =>
      editor ? editor.canDeleteProperty(propertyIri) : of({ canDo: false }),
    /** Deletes the property once checked and confirmed, then reads the project again. */
    deleteProperty: (propertyIri: string, label: string): Observable<boolean> =>
      editor ? reloadOnceSaved(editor.deleteProperty(propertyIri, label)) : of(false),
    /** Deletes those of the properties that can be, once confirmed, then reads the project again. */
    deleteProperties: (properties: { iri: string; label: string }[]): Observable<boolean> =>
      editor ? reloadOnceSaved(editor.deleteProperties(properties)) : of(false),
    canSetCardinality: (classIri: string, propertyIri: string, cardinality: Cardinality): Observable<CanDo> =>
      editor ? editor.canSetCardinality(classIri, propertyIri, cardinality) : of({ canDo: false }),
    /** Gives the class's property that cardinality, then reads the project again. */
    setCardinality: (classIri: string, propertyIri: string, cardinality: Cardinality): Observable<boolean> =>
      editor ? reloadOnceSaved(editor.setCardinality(classIri, propertyIri, cardinality)) : of(false),
    /** Whether properties can be put in another order here. */
    canReorder: !!editor,
    /** Saves the form order of the class's own properties, then reads the project again. Emits `true` once saved. */
    reorderProperties: (classIri: string, propertyIris: string[]): Observable<boolean> =>
      editor ? reloadOnceSaved(editor.reorderProperties(classIri, propertyIris)) : of(false),
    /** Whether vocabulary values can be added, edited, moved and deleted here, in the editor's dialogs. */
    canEditVocabularies: !!editor,
    addVocabularyValue: (parentIri: string, position: number): Observable<boolean> =>
      editor ? editor.addVocabularyValue(parentIri, position) : of(false),
    editVocabularyValue: (value: VocabularyValue): Observable<boolean> =>
      editor ? editor.editVocabularyValue(value) : of(false),
    deleteVocabularyValue: (value: VocabularyValue): Observable<boolean> =>
      editor ? editor.deleteVocabularyValue(value) : of(false),
    moveVocabularyValue: (valueIri: string, parentIri: string, position: number): Observable<boolean> =>
      editor ? editor.moveVocabularyValue(valueIri, parentIri, position) : of(false),
    /** Whether classes and properties can be created here, in the editor's dialogs. */
    canCreate: !!editor,
    /**
     * Creates a class of that kind in the data model, in the editor's dialog; once made, reads the project again and
     * calls `created` with its IRI.
     */
    createClass: (ontologyIri: string, kind: DefaultClass, created: (iri: string) => void) =>
      editor
        ?.createClass(ontologyIri, kind)
        .pipe(filter(Boolean), takeUntilDestroyed(destroyRef))
        .subscribe(iri => {
          project.reloadProject();
          created(iri);
        }),
    /** Creates a controlled vocabulary in the project, as `createClass` creates a class. */
    createVocabulary: (created: (iri: string) => void) =>
      editor
        ?.createVocabulary()
        .pipe(filter(Boolean), takeUntilDestroyed(destroyRef))
        .subscribe(iri => {
          project.reloadProject();
          created(iri);
        }),
    /** Creates a property of that type in the data model, as `createClass` creates a class. */
    createProperty: (ontologyIri: string, type: DefaultProperty, created: (iri: string) => void) =>
      editor
        ?.createProperty(ontologyIri, type)
        .pipe(filter(Boolean), takeUntilDestroyed(destroyRef))
        .subscribe(iri => {
          project.reloadProject();
          created(iri);
        }),
    editClass: (iri: string) => edit(iri, RouteConstants.classes, editor && (i => editor.editClass(i))),
    editProperty: (iri: string) => edit(iri, RouteConstants.properties, editor && (i => editor.editProperty(i))),
  };
}
