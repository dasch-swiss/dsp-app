import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProjectsSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';
import { PropertyInfo } from '../ontology.types';
import { OntologyEditService } from '../services/ontology-edit.service';

@Component({
  selector: 'app-ontology-properties',
  template: `
    <mat-list class="properties">
      <mat-list-item
        class="property"
        [class.admin]="(isAdmin$ | async) === true"
        *ngFor="let prop of oes.currentOntologyProperties$ | async; trackBy: trackByPropertyDefinitionFn">
        <app-property-info [property]="prop" />
      </mat-list-item>
    </mat-list>
  `,
  styles: `
    .properties {
      max-width: 100em;

      .property {
        background: white;
        border-radius: 8px;
        height: auto;
        margin: 8px 0;

        &.admin:hover {
          background: var(--element-active-hover);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OntologyPropertiesComponent {
  isAdmin$ = this._store.select(ProjectsSelectors.isCurrentProjectAdminOrSysAdmin);

  trackByPropertyDefinitionFn = (index: number, item: PropertyInfo) => `${index}-${item.propDef.id}`;

  constructor(
    public oes: OntologyEditService,
    private _store: Store
  ) {}
}
