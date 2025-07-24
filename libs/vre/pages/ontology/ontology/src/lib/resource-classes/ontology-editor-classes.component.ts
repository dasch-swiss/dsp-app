import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ClassDefinition } from '@dasch-swiss/dsp-js';
import { OntologyEditService } from '../services/ontology-edit.service';

@Component({
  selector: 'app-ontology-editor-classes',
  template: `<div class="ontology-editor-grid classes drag-drop-stop">
    <app-resource-class-info
      *ngFor="let resClass of ontoClasses$ | async; trackBy: trackByClassDefinitionFn"
      [resourceClass]="resClass" />
  </div>`,
  styles: `
    .ontology-editor-grid {
      display: grid;
      grid-template-rows: auto;
      grid-template-columns: repeat(auto-fill, minmax(640px, 1fr));
      grid-gap: 6px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OntologyEditorClassesComponent {
  ontoClasses$ = this._oes.currentOntologyClasses$;

  trackByClassDefinitionFn = (index: number, item: ClassDefinition) => `${index}-${item.id}`;

  constructor(private _oes: OntologyEditService) {}
}
