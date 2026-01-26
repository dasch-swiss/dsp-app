import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ResourceClassInfo } from '../ontology.types';
import { OntologyEditService } from '../services/ontology-edit.service';
import { ResourceClassInfoComponent } from './resource-class-info/resource-class-info.component';

@Component({
  selector: 'app-ontology-editor-page',
  template: `<div class="ontology-editor-grid drag-drop-stop">
    @for (resClass of oes.currentOntologyClasses$ | async; track trackByClassDefinitionFn($index, resClass)) {
      <app-resource-class-info [resourceClass]="resClass" />
    }
  </div>`,
  styles: `
    .ontology-editor-grid {
      display: grid;
      grid-template-rows: auto;
      grid-template-columns: repeat(auto-fill, minmax(640px, 1fr));
      grid-gap: 8px;
      padding: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, ResourceClassInfoComponent],
})
export class OntologyEditorPageComponent {
  trackByClassDefinitionFn = (index: number, item: ResourceClassInfo) => `${index}-${item.id}`;

  constructor(public readonly oes: OntologyEditService) {}
}
