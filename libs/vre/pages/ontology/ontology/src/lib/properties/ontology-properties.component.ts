import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { PropertyInfo } from '../ontology.types';
import { OntologyEditService } from '../services/ontology-edit.service';

@Component({
  selector: 'app-ontology-properties',
  template: `
    <mat-list class="properties">
      @for (prop of oes.currentOntologyProperties$ | async; track trackByPropertyDefinitionFn($index, prop)) {
        <mat-list-item class="property" [class.admin]="(hasProjectAdminRights$ | async) === true">
          <app-property-info [property]="prop" />
        </mat-list-item>
      }
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
  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  trackByPropertyDefinitionFn = (index: number, item: PropertyInfo) => `${index}-${item.propDef.id}`;

  constructor(
    public oes: OntologyEditService,
    private _projectPageService: ProjectPageService
  ) {}
}
