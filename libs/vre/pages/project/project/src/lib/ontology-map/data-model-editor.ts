import { DestroyRef, inject, InjectionToken } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
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
  saveClassTexts(classIri: string, texts: ClassTexts): Observable<boolean>;
}

/** A class's labels or description, in each language it has. */
export interface ClassTexts {
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
  return {
    /** Whether labels and descriptions can be saved in place, without the data model editor's page. */
    canSaveInPlace: !!editor,
    /** Saves the class's labels or description; the project is read again once saved. Emits `true` once saved. */
    saveClassTexts: (iri: string, texts: ClassTexts): Observable<boolean> =>
      editor
        ? editor.saveClassTexts(iri, texts).pipe(
            tap(saved => saved && project.reloadProject()),
            map(Boolean)
          )
        : of(false),
    editClass: (iri: string) => edit(iri, RouteConstants.classes, editor && (i => editor.editClass(i))),
    editProperty: (iri: string) => edit(iri, RouteConstants.properties, editor && (i => editor.editProperty(i))),
  };
}
