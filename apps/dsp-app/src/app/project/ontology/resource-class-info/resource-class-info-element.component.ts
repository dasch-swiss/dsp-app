import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import {
  Cardinality,
  ClassDefinition,
  Constants,
  KnoraApiConnection,
  PropertyDefinition,
  ReadOntology,
  ResourcePropertyDefinitionWithAllLanguages,
  UpdateOntology,
  UpdateResourceClassCardinality,
} from '@dasch-swiss/dsp-js';
import { GuiCardinality } from '@dasch-swiss/vre/shared/app-common-to-move';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DefaultClass, DefaultProperty } from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologiesSelectors, OntologyProperties, PropToDisplay } from '@dasch-swiss/vre/shared/app-state';
import { DialogService } from '@dasch-swiss/vre/shared/app-ui';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-resource-class-info-element',
  template: ` <div cdkDrag [cdkDragDisabled]="!ontology.lastModificationDate || !canChangeGuiOrder || !userCanEdit">
    <div class="drag-n-drop-placeholder" *cdkDragPlaceholder></div>
    <mat-list-item class="property" [disabled]="loadProperty">
      <span cdkDragHandle matListItemIcon class="list-icon gui-order">
        <span [class.hide-on-hover]="canChangeGuiOrder && (lastModificationDate$ | async) && userCanEdit">
          {{ i + 1 }})
        </span>
        <span
          *ngIf="canChangeGuiOrder && (lastModificationDate$ | async) && userCanEdit"
          class="display-on-hover drag-n-drop-handle">
          <mat-icon>drag_indicator</mat-icon>
        </span>
      </span>
      <!-- display only properties if they exist in list of properties;
                                                                                                                                                                                                                                                       objectType is not a linkValue (otherwise we have the property twice) -->
      <span matListItemTitle>
        <app-resource-class-property-info
          class="property-info"
          [propDef]="prop?.propDef"
          [propCard]="prop"
          [projectUuid]="projectUuid"
          [resourceIri]="resourceClass.id"
          [lastModificationDate]="lastModificationDate$ | async"
          [userCanEdit]="userCanEdit"
          [resourceClass]="resourceClass"
          (removePropertyFromClass)="removePropertyFromClass.emit($event)"
          (changeCardinalities)="newChangeCardinalities($event, props)">
        </app-resource-class-property-info>
      </span>
    </mat-list-item>
  </div>`,
  styles: [
    `
      :host:hover {
        .hide-on-hover {
          display: none;
        }

        .display-on-hover {
          display: block;
        }
      }

      .display-on-hover {
        display: none;
      }

      .drag-n-drop-handle {
        cursor: move;
        color: black;
      }

      .cdk-drag-handle {
        margin-right: 8px !important;
      }

      .hide-on-hover {
        color: black;
      }
    `,
  ],
})
export class ResourceClassInfoElementComponent implements OnInit {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  @Input() userCanEdit: boolean;
  @Input() resourceClass: ClassDefinition;
  @Input() projectUuid: string;
  @Input() prop: PropToDisplay;
  @Input() props: PropToDisplay[];
  @Input() i: number; // index
  @Output() removePropertyFromClass = new EventEmitter<DefaultClass>();

  @Select(OntologiesSelectors.currentProjectOntologyProperties)
  currentProjectOntologyProperties$: Observable<OntologyProperties[]>;

  currentOntology$ = this._store.select(OntologiesSelectors.currentOntology);

  lastModificationDate$ = this.currentOntology$.pipe(
    takeUntil(this.ngUnsubscribe),
    map(x => x?.lastModificationDate)
  );

  ontology: ReadOntology;
  canChangeGuiOrder = true; // TODO
  loadProperty = false;

  constructor(
    private _store: Store,
    private _dialogService: DialogService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {}

  ngOnInit() {
    this.ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
  }

  newChangeCardinalities(
    cardRequest: {
      prop: PropToDisplay;
      propType: DefaultProperty;
      targetCardinality: GuiCardinality;
    },
    currentOntologyPropertiesToDisplay: PropToDisplay[]
  ) {
    this._dialogService.afterConfirmation('Please note that this change may not be reversible.').subscribe(() => {
      // get the ontology, the class and its properties
      const classUpdate = new UpdateOntology<UpdateResourceClassCardinality>();
      classUpdate.lastModificationDate = this.ontology.lastModificationDate;
      classUpdate.id = this.ontology.id;
      const changedClass = new UpdateResourceClassCardinality();
      changedClass.id = this.resourceClass.id;
      changedClass.cardinalities = currentOntologyPropertiesToDisplay;

      // get the property for replacing the cardinality
      const idx = changedClass.cardinalities.findIndex(c => c.propertyIndex === cardRequest.prop.propDef.id);
      if (idx === -1) {
        return;
      }
      // set the new cardinality
      changedClass.cardinalities[idx].cardinality = Cardinality._1_n; // TODO CHANGE TO VALUE RECEIVED!!;

      classUpdate.entity = changedClass;
      this._dspApiConnection.v2.onto.replaceCardinalityOfResourceClass(classUpdate).subscribe(() => {});
    });
  }

  private getPropsToDisplay(classProps: PropToDisplay[], ontoProperties: OntologyProperties[]): PropToDisplay[] {
    if (classProps.length === 0 || ontoProperties.length === 0) {
      return [];
    }

    const propsToDisplay: PropToDisplay[] = [];
    let remainingProperties: PropertyDefinition[] = [];
    classProps.forEach((hasProp: PropToDisplay) => {
      const ontoIri = hasProp.propertyIndex.split(Constants.HashDelimiter)[0];
      // ignore http://api.knora.org/ontology/knora-api/v2 and ignore  http://www.w3.org/2000/01/rdf-schema
      if (ontoIri !== Constants.KnoraApiV2 && ontoIri !== Constants.Rdfs) {
        // get property definition from list of project ontologies
        const index = ontoProperties.findIndex((item: OntologyProperties) => item.ontology === ontoIri);
        remainingProperties = [...ontoProperties[index].properties];
        hasProp.propDef = remainingProperties.find(
          (obj: ResourcePropertyDefinitionWithAllLanguages) =>
            obj.id === hasProp.propertyIndex &&
            ((obj.subjectType && !obj.subjectType.includes('Standoff') && obj.objectType !== Constants.LinkValue) ||
              !obj.isLinkValueProperty)
        );

        // propDef was found, add hasProp to the properties list which has to be displayed in this resource class
        if (hasProp.propDef) {
          if (propsToDisplay.indexOf(hasProp) === -1) {
            propsToDisplay.push(hasProp);
          }

          // and remove from list of existing properties to avoid double cardinality entries
          // because the prop displayed in the class cannot be added a second time,
          // so we have to hide it from the list of "Add existing property"
          const delProp = remainingProperties.indexOf(hasProp.propDef, 0);
          if (delProp > -1) {
            remainingProperties.splice(delProp, 1);
          }
        }
      }
    });

    return propsToDisplay;
  }
}
