import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Edits a class's labels and description in place, in the data model editor's dialog. That dialog belongs to the
 * ontology pages, which depend on this library, so the app provides it here; see `app.routes.ts`.
 */
export interface ClassEditor {
  /** Opens the dialog for the class; emits once it closes, `true` if the class was saved. */
  edit(classIri: string): Observable<boolean>;
}

/** The class editor, if the app provides one; without it, "Edit class" opens the data model editor instead. */
export const CLASS_EDITOR = new InjectionToken<ClassEditor>('ClassEditor');
