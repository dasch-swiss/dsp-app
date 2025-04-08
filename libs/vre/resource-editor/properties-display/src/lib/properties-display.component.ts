import { Component, Input, OnChanges } from '@angular/core';
import { Cardinality, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { ResourceSelectors } from '@dasch-swiss/vre/core/state';
import { PropertiesDisplayService } from '@dasch-swiss/vre/resource-editor/resource-properties';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { Store } from '@ngxs/store';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-properties-display',
  template: `
    <div style="display: flex; align-items: center; background: #EAEFF3">
      <h3 style="margin: 0 16px" *ngIf="displayLabel" data-cy="property-header">{{ resource.res.label }}</h3>
      <div style="display: flex; justify-content: end; flex: 1">
        <app-properties-toolbar [showToggleProperties]="true" [showOnlyIcons]="displayLabel" style="flex-shrink: 0" />
        <app-annotation-toolbar *ngIf="displayLabel" [resource]="resource.res" [parentResourceId]="parentResourceId" />
      </div>
    </div>

    <div
      class="infobar mat-caption"
      *ngIf="displayLabel && ((resourceAttachedUser$ | async) !== undefined || resource.res.creationDate)">
      Created
      <span *ngIf="resourceAttachedUser$ | async as resourceAttachedUser">
        by
        {{
          resourceAttachedUser.username
            ? resourceAttachedUser.username
            : resourceAttachedUser.givenName + ' ' + resourceAttachedUser.familyName
        }}
      </span>
      <span *ngIf="resource.res.creationDate"> on {{ resource.res.creationDate | date }}</span>
    </div>

    <!-- list of properties -->
    <ng-container *ngIf="editableProperties && editableProperties.length > 0; else noProperties">
      <app-property-row
        [isEmptyRow]="prop.values.length === 0"
        *ngFor="let prop of editableProperties; let last = last; trackBy: trackByPropertyInfoFn"
        [borderBottom]="true"
        [tooltip]="prop.propDef.comment"
        [prop]="prop"
        [singleRow]="false"
        [label]="
          prop.propDef.label +
          (prop.guiDef.cardinality === cardinality._1 || prop.guiDef.cardinality === cardinality._1_n ? '*' : '')
        ">
        <app-existing-property-value [prop]="prop" [resource]="resource.res" />
      </app-property-row>
    </ng-container>

    <app-standoff-links-property [resource]="resource" />
    <app-incoming-links-property [resource]="resource.res" />

    <ng-template #noProperties>
      <app-property-row label="info" [borderBottom]="false" [isEmptyRow]="false">
        <div>This resource has no defined properties.</div>
      </app-property-row>
    </ng-template>
  `,
  styles: [
    `
      .infobar {
        text-align: right;
        padding-right: 6px;
      }
    `,
  ],
  providers: [PropertiesDisplayService],
})
export class PropertiesDisplayComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  @Input() displayLabel = false;
  @Input() linkToNewTab?: string;
  @Input() parentResourceId = '';

  protected readonly cardinality = Cardinality;

  resourceAttachedUser$ = this._store
    .select(ResourceSelectors.attachedUsers)
    .pipe(
      map(attachedUsers =>
        attachedUsers[this.resource.res.id]?.value.find(u => u.id === this.resource.res.attachedToUser)
      )
    );

  editableProperties: PropertyInfoValues[] = [];

  constructor(private _store: Store) {}

  ngOnChanges() {
    this.editableProperties = this.resource.resProps.filter(
      prop => (prop.propDef as ResourcePropertyDefinition).isEditable
    );
  }

  trackByPropertyInfoFn = (index: number, item: PropertyInfoValues) => `${index}-${item.propDef.id}`;
}
