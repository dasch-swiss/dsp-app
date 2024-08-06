import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ClassDefinition,
  Constants,
  KnoraApiConnection,
  ResourcePropertyDefinitionWithAllLanguages,
  UpdateOntology,
  UpdateResourceClassCardinality,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import {
  DefaultProperties,
  DefaultProperty,
  OntologyService,
  PropertyCategory,
  PropertyInfoObject,
} from '@dasch-swiss/vre/shared/app-helper-services';
import {
  CreatePropertyFormDialogComponent,
  CreatePropertyFormDialogProps,
} from '@dasch-swiss/vre/shared/app-property-form';
import { OntologiesSelectors, OntologyProperties, PropToAdd, PropToDisplay } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-property-menu',
  template: `
    <mat-list style="border-top: 1px solid rgba(0, 0, 0, .12);">
      <!-- here we have to know if the class has values or not -->
      <mat-list-item
        *ngIf="(lastModificationDate$ | async) && projectStatus && userCanEdit"
        class="property link"
        data-cy="add-property-button"
        [matMenuTriggerFor]="addPropertyMenu">
        <mat-icon matListItemIcon class="list-icon">add</mat-icon>
        <span matListItemTitle>Add property</span>
      </mat-list-item>
    </mat-list>

    <mat-menu #addPropertyMenu="matMenu" xPosition="after">
      <button data-cy="create-new-from-type-button" mat-menu-item [matMenuTriggerFor]="newFromPropType">
        Create new from type
      </button>
      <button data-cy="add-existing-property-button" mat-menu-item [matMenuTriggerFor]="addExistingProp">
        Add existing property
      </button>
    </mat-menu>

    <mat-menu #addExistingProp="matMenu" class="default-nested-sub-menu">
      <ng-container *ngFor="let onto of existingProperties$ | async; trackBy: trackByPropToAddFn">
        <button mat-menu-item [disabled]="!onto.properties.length" [matMenuTriggerFor]="sub_menu">
          {{ onto.ontologyLabel }}
        </button>
        <mat-menu #sub_menu="matMenu" class="default-nested-sub-menu">
          <button
            mat-menu-item
            *ngFor="let prop of onto.properties; trackBy: trackByPropFn"
            [matTooltip]="prop.propDef.comment"
            matTooltipPosition="after"
            (click)="assignExistingProperty(prop)">
            <mat-icon>{{ prop.propType?.icon }}</mat-icon>
            {{ prop.propDef.label }}
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
})
export class AddPropertyMenuComponent {
  @Input() currentOntologyPropertiesToDisplay: PropToDisplay[];
  @Input() resourceClass: ClassDefinition;
  @Input() projectStatus: boolean;
  @Input() userCanEdit: boolean; // is user a project admin or sys admin?
  @Output() updatePropertyAssignment = new EventEmitter<string>();

  private ngUnsubscribe = new Subject<void>();
  readonly defaultProperties: PropertyCategory[] = DefaultProperties.data;

  currentOntology$ = this._store.select(OntologiesSelectors.currentOntology);

  lastModificationDate$ = this.currentOntology$.pipe(
    takeUntil(this.ngUnsubscribe),
    map(x => x?.lastModificationDate)
  );
  currentProjectOntologyProperties$ = this._store.select(OntologiesSelectors.currentProjectOntologyProperties);

  // list of existing ontology properties, which are not in this resource class
  existingProperties$ = this.currentProjectOntologyProperties$.pipe(
    takeUntil(this.ngUnsubscribe),
    map(ontoProperties => this.getExistingProperties([...this.resourceClass.propertiesList], [...ontoProperties]))
  );

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _store: Store,
    private _ontoService: OntologyService
  ) {}

  trackByPropToAddFn = (index: number, item: PropToAdd) => `${index}-${item.ontologyId}`;

  trackByPropCategoryFn = (index: number, item: PropertyCategory) => `${index}-${item.group}`;

  trackByDefaultPropertyFn = (index: number, item: DefaultProperty) => `${index}-${item.label}`;

  trackByPropFn = (index: number, item: PropertyInfoObject) => `${index}-${item.propDef?.id}`;

  assignExistingProperty(prop: PropertyInfoObject) {
    const maxGuiOrderProperty = this.resourceClass.propertiesList.reduce(
      (prev, current) => Math.max(prev, current.guiOrder ?? 0),
      0
    );

    const currentOntology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);

    const onto = new UpdateOntology<UpdateResourceClassCardinality>();
    onto.lastModificationDate = currentOntology.lastModificationDate;
    onto.id = currentOntology.id;

    const addCard = new UpdateResourceClassCardinality();
    addCard.id = this.resourceClass.id;

    addCard.cardinalities = [
      {
        propertyIndex: prop.propDef.id,
        cardinality: 1,
        guiOrder: maxGuiOrderProperty + 1,
      },
    ];

    onto.entity = addCard;

    this._dspApiConnection.v2.onto
      .addCardinalityToResourceClass(onto)
      .pipe(take(1))
      .subscribe(() => {
        this.updatePropertyAssignment.emit(currentOntology.id);
      });
  }

  addNewProperty(propType: DefaultProperty) {
    const maxGuiOrderProperty = this.resourceClass.propertiesList.reduce(
      (prev, current) => Math.max(prev, current.guiOrder ?? 0),
      0
    );

    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    this._dialog
      .open<CreatePropertyFormDialogComponent, CreatePropertyFormDialogProps, boolean>(
        CreatePropertyFormDialogComponent,
        {
          data: {
            ontologyId: ontology.id,
            lastModificationDate: ontology.lastModificationDate,
            propertyInfo: { propType },
            resClassIri: this.resourceClass.id,
            maxGuiOrderProperty,
          },
        }
      )
      .afterClosed()
      .pipe(filter(res => res === true))
      .subscribe(res => {
        this.updatePropertyAssignment.emit(ontology.id);
      });
  }

  private getExistingProperties(classProps: PropToDisplay[], ontoProperties: OntologyProperties[]): PropToAdd[] {
    if (classProps.length === 0 || ontoProperties.length === 0) {
      return [];
    }
    const existingProperties: PropToAdd[] = [];
    const currentProjectOntologies = this._store
      .selectSnapshot(OntologiesSelectors.currentProjectOntologies)
      .filter(p => !classProps.some(c => c.propertyIndex === p.id));
    ontoProperties.forEach((op: OntologyProperties, i: number) => {
      const onto = currentProjectOntologies.find(j => j?.id === op.ontology);
      existingProperties.push({
        ontologyId: op.ontology,
        ontologyLabel: onto?.label,
        properties: [],
      });

      op.properties.forEach((availableProp: ResourcePropertyDefinitionWithAllLanguages) => {
        const superProp = this._ontoService.getSuperProperty(availableProp, currentProjectOntologies);
        if (superProp && availableProp.subPropertyOf.indexOf(superProp) === -1) {
          availableProp.subPropertyOf.push(superProp);
        }

        let propType: DefaultProperty;
        // find corresponding default property to have more prop info
        this._ontoService.getDefaultPropType(availableProp).subscribe((prop: DefaultProperty) => {
          propType = prop;
        });

        const propToAdd: PropertyInfoObject = {
          propType,
          propDef: availableProp,
        };

        if (this.isPropertyToAdd(classProps, availableProp)) {
          existingProperties[i].properties.push(propToAdd);
        }
      });
    });

    return existingProperties;
  }

  private isPropertyToAdd(
    classProps: PropToDisplay[],
    availableProp: ResourcePropertyDefinitionWithAllLanguages
  ): boolean {
    return (
      classProps.findIndex(x => x.propertyIndex === availableProp.id) === -1 &&
      ((availableProp.subjectType &&
        !availableProp.subjectType.includes('Standoff') &&
        availableProp.objectType !== Constants.LinkValue) ||
        !availableProp.isLinkValueProperty)
    );
  }
}
