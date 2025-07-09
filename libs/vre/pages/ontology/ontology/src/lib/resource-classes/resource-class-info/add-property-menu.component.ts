import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DefaultProperties, DefaultProperty, PropertyCategory } from '@dasch-swiss/vre/shared/app-helper-services';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { EditPropertyFormDialogComponent } from '../../forms/property-form/edit-property-form-dialog.component';
import { CreatePropertyDialogData } from '../../forms/property-form/property-form.type';
import { PropertyInfo, PropToAdd, ResourceClassInfo } from '../../ontology.types';
import { OntologyEditService } from '../../services/ontology-edit.service';

@Component({
  selector: 'app-add-property-menu',
  template: `
    <mat-list style="border-top: 1px solid rgba(0, 0, 0, .12);">
      <mat-list-item class="property link" data-cy="add-property-button" [matMenuTriggerFor]="addPropertyMenu">
        <mat-icon matListItemIcon class="list-icon">add</mat-icon>
        <span matListItemTitle>Add property</span>
      </mat-list-item>
    </mat-list>

    <mat-menu #addPropertyMenu="matMenu" xPosition="after">
      <button data-cy="create-new-from-type-button" mat-menu-item [matMenuTriggerFor]="newFromPropType">
        Create new from type
      </button>
      <button
        data-cy="add-existing-property-button"
        mat-menu-item
        [matMenuTriggerFor]="addExistingProp"
        *ngIf="resourceClass">
        Add existing property
      </button>
    </mat-menu>

    <mat-menu #addExistingProp="matMenu" class="default-nested-sub-menu">
      <ng-container *ngFor="let onto of availableProperties$ | async; trackBy: trackByPropToAddFn">
        <button mat-menu-item [disabled]="!onto.properties.length" [matMenuTriggerFor]="sub_menu">
          {{ onto.ontologyLabel }}
        </button>
        <mat-menu #sub_menu="matMenu" class="default-nested-sub-menu">
          <button
            mat-menu-item
            *ngFor="let prop of onto.properties; trackBy: trackByPropFn"
            [matTooltip]="prop.propDef!.comment || ''"
            matTooltipPosition="after"
            (click)="assignExistingProperty(prop.propDef!.id)">
            <mat-icon>{{ prop.propType?.icon }}</mat-icon>
            {{ prop.propDef!.label }}
          </button>
        </mat-menu>
      </ng-container>
    </mat-menu>

    <mat-menu #newFromPropType="matMenu">
      <ng-container *ngFor="let type of defaultProperties; trackBy: trackByPropCategoryFn">
        <button mat-menu-item [matMenuTriggerFor]="sub_menu" [attr.data-cy]="type.group">{{ type.group }}</button>
        <mat-menu #sub_menu="matMenu" class="default-nested-sub-menu">
          <button
            mat-menu-item
            *ngFor="let ele of type.elements; trackBy: trackByDefaultPropertyFn"
            [value]="ele"
            [attr.data-cy]="ele.label"
            [matTooltip]="ele.description"
            matTooltipPosition="after"
            (click)="addNewProperty(ele)">
            <mat-icon>{{ ele.icon }}</mat-icon>
            {{ ele.label }}
          </button>
        </mat-menu>
      </ng-container>
    </mat-menu>
  `,
  styles: [
    `
      .property:hover {
        background: #d7e1e9;
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPropertyMenuComponent {
  @Input({ required: true }) resourceClass!: ResourceClassInfo;
  @Output() updatePropertyAssignment = new EventEmitter<string>();

  private ngUnsubscribe = new Subject<void>();
  readonly defaultProperties: PropertyCategory[] = DefaultProperties.data;

  availableProperties$: Observable<PropToAdd[]> = this._oes.currentProjectsProperties$.pipe(
    takeUntil(this.ngUnsubscribe),
    map(allProps => {
      const usedByClass = new Set(this.resourceClass?.iHasProperties.map(p => p.propertyIndex));
      const groupedUnused = new Map<string, PropToAdd>();

      allProps.forEach(prop => {
        if (usedByClass.has(prop.propDef.id)) return;

        const group = groupedUnused.get(prop.baseOntologyId) ?? {
          ontologyId: prop.baseOntologyId,
          ontologyLabel: prop.baseOntologyLabel,
          properties: [],
        };

        group.properties.push(prop);
        groupedUnused.set(prop.baseOntologyId, group);
      });

      return Array.from(groupedUnused.values());
    })
  );

  constructor(
    private _dialog: MatDialog,
    private _oes: OntologyEditService
  ) {}

  trackByPropToAddFn = (index: number, item: PropToAdd) => `${index}-${item.ontologyId}`;

  trackByPropCategoryFn = (index: number, item: PropertyCategory) => `${index}-${item.group}`;

  trackByDefaultPropertyFn = (index: number, item: DefaultProperty) => `${index}-${item.label}`;

  trackByPropFn = (index: number, item: PropertyInfo) => `${index}-${item.propDef?.id}`;

  assignExistingProperty(propertyId: string) {
    this._oes.assignPropertyToClass(propertyId, this.resourceClass.resourceClassDefinition);
  }

  addNewProperty(propType: DefaultProperty) {
    const createData: CreatePropertyDialogData = {
      propType,
      assignToClass: this.resourceClass.resourceClassDefinition,
    };
    this._dialog.open<EditPropertyFormDialogComponent, CreatePropertyDialogData>(EditPropertyFormDialogComponent, {
      data: createData,
    });
  }
}
