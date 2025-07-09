import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PropertyDefinition } from '@dasch-swiss/dsp-js';
import { Observable } from 'rxjs';
import { PropertyInfo } from '../ontology.types';
import { OntologyEditService } from '../services/ontology-edit.service';

@Component({
  selector: 'app-ontology-properties',
  template: `
    <div class="ontology-editor-list properties">
      <mat-list class="without-padding">
        <mat-list-item
          class="property"
          *ngFor="let prop of properties$ | async; trackBy: trackByPropertyDefinitionFn; let odd = odd"
          [class.odd]="odd">
          <app-property-info [property]="prop" />
        </mat-list-item>
      </mat-list>
    </div>
  `,
  styles: `
    @use 'config' as *;
    .ontology-editor-list {
      margin: 16px;

      &.properties {
        width: 80%;
        margin: 16px 10%;

        .property {
          height: auto;
          min-height: 56px !important;
          margin: 4px 0;
          padding: 16px 0;

          &.odd {
            background-color: $primary_50;
          }

          &:hover {
            background-color: $black-14-opacity;
          }
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OntologyPropertiesComponent {
  properties$: Observable<PropertyInfo[]> = this._oes.currentOntologyProperties$;

  trackByPropertyDefinitionFn = (index: number, item: PropertyDefinition) => `${index}-${item.id}`;

  constructor(private _oes: OntologyEditService) {}
}
