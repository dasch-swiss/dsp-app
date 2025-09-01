import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ResourceClassInfo } from '../ontology.types';
import { OntologyEditService } from '../services/ontology-edit.service';

@Component({
  selector: 'app-ontology-editor-page',
  template: `<div class="ontology-editor-grid classes drag-drop-stop">
    <app-resource-class-info
      *ngFor="let resClass of oes.currentOntologyClasses$ | async; trackBy: trackByClassDefinitionFn"
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
export class OntologyEditorPageComponent {
  trackByClassDefinitionFn = (index: number, item: ResourceClassInfo) => `${index}-${item.id}`;

  constructor(public oes: OntologyEditService) {}
}
