import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  CanDoResponse,
  ClassDefinition,
  Constants,
  KnoraApiConnection,
  PropertyDefinition,
  ReadOntology,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import {
  DefaultClass,
  DefaultProperties,
  DefaultProperty,
  DefaultResourceClasses,
  OntologyService,
  PropertyCategory,
  PropertyInfoObject,
  SortingService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import {
  OntologiesSelectors,
  OntologyProperties,
  PropertyAssignment,
  PropToAdd,
  PropToDisplay,
  RemovePropertyAction,
  ReplacePropertyAction,
} from '@dasch-swiss/vre/shared/app-state';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { DialogComponent, DialogEvent } from '../../../main/dialog/dialog.component';
import { GuiCardinality } from './resource-class-property-info/resource-class-property-info.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-class-info',
  templateUrl: './resource-class-info.component.html',
  styleUrls: ['./resource-class-info.component.scss'],
})
export class ResourceClassInfoComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  // open / close res class card
  @Input() expanded = false;

  @Input() resourceClass: ClassDefinition;

  @Input() projectUuid: string;

  @Input() projectStatus: boolean;

  get lastModificationDate$(): Observable<string> {
    return this.currentOntology$.pipe(
      takeUntil(this.ngUnsubscribe),
      map(x => x?.lastModificationDate)
    );
  }

  @Input() userCanEdit: boolean; // is user a project admin or sys admin?

  // event emitter when the lastModificationDate changed; bidirectional binding with lastModificationDate parameter

  // event emitter when the lastModificationDate changed; bidirectional binding with lastModificationDate parameter
  @Output() ontoPropertiesChange: EventEmitter<PropertyDefinition[]> = new EventEmitter<PropertyDefinition[]>();

  // to update the resource class itself (edit or delete)
  @Output() editResourceClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();
  @Output() deleteResourceClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();

  // to update the assignment of a property to a class we need the information about property (incl. propType)
  // and resource class
  @Output() updatePropertyAssignment: EventEmitter<string> = new EventEmitter<string>();

  @Input() updatePropertyAssignment$: Subject<any>;

  ontology: ReadOntology;

  // set to false if it is a subclass of a default class inheriting the order
  canChangeGuiOrder: boolean;

  classCanBeDeleted: boolean;

  subClassOfLabel = '';

  // list of default resource classes
  defaultClasses: DefaultClass[] = DefaultResourceClasses.data;

  // list of default property types
  defaultProperties: PropertyCategory[] = DefaultProperties.data;

  // load single property (in case of property cardinality action)
  loadProperty = false;

  get currentOntologyPropertiesToDisplay$(): Observable<PropToDisplay[]> {
    return this.currentProjectOntologyProperties$.pipe(
      takeUntil(this.ngUnsubscribe),
      map(ontoProperties => this.getPropsToDisplay([...this.resourceClass.propertiesList], [...ontoProperties]))
    );
  }

  // list of existing ontology properties, which are not in this resource class
  get existingProperties$(): Observable<PropToAdd[]> {
    return this.currentProjectOntologyProperties$.pipe(
      takeUntil(this.ngUnsubscribe),
      map(ontoProperties => this.getExistingProperties([...this.resourceClass.propertiesList], [...ontoProperties]))
    );
  }

  // list of all ontologies with their properties
  @Select(OntologiesSelectors.currentProjectOntologyProperties)
  currentProjectOntologyProperties$: Observable<OntologyProperties[]>;
  @Select(OntologiesSelectors.currentOntology)
  currentOntology$: Observable<ReadOntology>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _dialog: MatDialog,
    private _notification: NotificationService,
    private _sortingService: SortingService,
    private _store: Store,
    private _actions$: Actions,
    private _ontoService: OntologyService
  ) {}

  ngOnInit(): void {
    this.ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    // translate iris from "subclass of" array
    this.translateSubClassOfIri(this.resourceClass.subClassOf);
    // check if the class can be deleted
    this.canBeDeleted();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  trackByPropToAddFn = (index: number, item: PropToAdd) => `${index}-${item.ontologyId}`;

  trackByPropCategoryFn = (index: number, item: PropertyCategory) => `${index}-${item.group}`;

  trackByDefaultPropertyFn = (index: number, item: DefaultProperty) => `${index}-${item.label}`;

  trackByPropFn = (index: number, item: PropertyInfoObject) => `${index}-${item.propDef?.id}`;

  trackByPropToDisplayFn = (index: number, item: PropToDisplay) => `${index}-${item.propertyIndex}`;

  /**
   * prepares props to display
   * Not all props should be displayed; there are some system / API-specific
   * properties which have to be filtered.
   *
   * @param classProps
   */
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

  /**
   * translates iris from "subclass of" array
   * - display label from default resource classes (as part of DSP System Project)
   * - in case the class is a subclass of another class in the same ontology: display this class label
   * - in none of those cases display the name from the class IRI
   *
   * @param classIris
   */
  translateSubClassOfIri(classIris: string[]) {
    // reset the label
    this.subClassOfLabel = '';

    classIris.forEach((iri, index) => {
      // get ontology iri from class iri
      const splittedIri = iri.split('#');
      const ontologyIri = splittedIri[0];
      const className = splittedIri[1];

      this.subClassOfLabel += index > 0 ? ', ' : '';

      // find default class for the current class iri
      const defaultClass = this.defaultClasses.find(i => i.iri === iri);
      if (defaultClass) {
        this.subClassOfLabel += defaultClass.label;
        this.canChangeGuiOrder = true;
      } else if (this.ontology.id === ontologyIri) {
        // the class is not defined in the default classes
        // but defined in the current ontology
        // get class label from there
        this.subClassOfLabel += this.ontology.classes[iri].label;
        // in this case, the user can't update the cardinality incl. the gui order in this class
        // we have to disable this update cardinality functionality
        this.canChangeGuiOrder = false;
      } else {
        // the ontology iri of the upper class couldn't be found
        // display the class name
        if (className) {
          this.subClassOfLabel += className;
        } else {
          // iri is not kind of [ontologyIri]#[className]
          this.subClassOfLabel += iri
            .split('/')
            .filter(e => e)
            .slice(-1);
        }
        // in this case, the user can't update the currentCardinality incl. the gui order in this class
        // we have to disable this update currentCardinality functionality
        this.canChangeGuiOrder = false;
      }
    });
  }

  initOntoProperties(allOntoProperties: PropertyDefinition[]): PropertyDefinition[] {
    // reset the ontology properties
    const listOfProperties = [];

    // display only the properties which are not a subjectType of Standoff
    allOntoProperties.forEach(resProp => {
      const standoff = resProp.subjectType ? resProp.subjectType.includes('Standoff') : false;
      if (resProp.objectType !== Constants.LinkValue && !standoff) {
        listOfProperties.push(resProp);
      }
    });
    // sort properties by label
    // --> TODO: add sort functionallity to the gui
    return this._sortingService.keySortByAlphabetical(listOfProperties, 'label');
  }

  canBeDeleted() {
    // check if the class can be deleted
    this._dspApiConnection.v2.onto
      .canDeleteResourceClass(this.resourceClass.id)
      .subscribe((response: CanDoResponse) => {
        this.classCanBeDeleted = response.canDo;
      });
  }

  addNewProperty(propType: DefaultProperty, currentOntologyPropertiesToDisplay: PropToDisplay[]) {
    const propertyAssignment: PropertyAssignment = {
      resClass: this.resourceClass,
      property: {
        propType,
      },
    };
    this.assignProperty(propertyAssignment, currentOntologyPropertiesToDisplay);
  }

  addExistingProperty(prop: PropertyInfoObject, currentOntologyPropertiesToDisplay: PropToDisplay[]) {
    const propertyAssignment: PropertyAssignment = {
      resClass: this.resourceClass,
      property: {
        propType: prop.propType,
        propDef: prop.propDef,
      },
    };
    this.assignProperty(propertyAssignment, currentOntologyPropertiesToDisplay);
  }

  /**
   * removes property from resource class
   * @param property
   */
  removeProperty(property: DefaultClass, currentOntologyPropertiesToDisplay: PropToDisplay[]) {
    // TODO temporary solution to replace eventemitter with subject because emitter loses subscriber after following subscription is triggered
    this.updatePropertyAssignment.pipe(take(1)).subscribe(() => this.updatePropertyAssignment$.next());

    this._store.dispatch(new RemovePropertyAction(property, this.resourceClass, currentOntologyPropertiesToDisplay));
    this._actions$
      .pipe(ofActionSuccessful(RemovePropertyAction))
      .pipe(take(1))
      .subscribe(res => {
        // TODO should be the same as ontology lastModificationDate ? if yes remove commented line, otherwise add additional lastModificationDate property to the state
        // this.lastModificationDate = res.lastModificationDate;
        this.updatePropertyAssignment.emit(this.ontology.id);
      });
  }

  /**
   * assignProperty: Open the dialogue in order to add an existing property to a class or to create a new
   * property and add it to the class
   * @param propertyAssignment information about the link of a property to a class
   * */
  assignProperty(propertyAssignment: PropertyAssignment, currentOntologyPropertiesToDisplay: PropToDisplay[]) {
    if (!propertyAssignment) {
      return;
    }
    const classLabel = propertyAssignment.resClass.label;

    let mode: 'createProperty' | 'editProperty' = 'createProperty';
    let propLabel = `${propertyAssignment.property.propType.group}: ${propertyAssignment.property.propType.label}`;
    let title = `Add new property of type "${propLabel}" to class "${classLabel}"`;
    if (propertyAssignment.property.propDef) {
      // the property already exists. To assign an existing property simply open the dialog in edit mode
      mode = 'editProperty';
      propLabel = propertyAssignment.property.propDef.label;
      title = `Add existing property "${propLabel}" to class "${classLabel}"`;
    }

    const dialogConfig: MatDialogConfig = {
      width: '640px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        propInfo: propertyAssignment.property,
        title,
        subtitle: 'Customize property and cardinality',
        mode,
        parentIri: propertyAssignment.resClass.id,
        position: currentOntologyPropertiesToDisplay.length + 1,
      },
    };
    this.openEditDialog(dialogConfig);
  }

  /**
   * changeCardinalities: Open the dialogue in order to change the currentCardinality of an existing property and
   * class combination
   * @param cardRequest information about the property, its type and its new cardinalities to be set
   * */
  changeCardinalities(
    cardRequest: {
      prop: PropToDisplay;
      propType: DefaultProperty;
      targetCardinality: GuiCardinality;
    },
    currentOntologyPropertiesToDisplay: PropToDisplay[]
  ) {
    const dialogConfig: MatDialogConfig = {
      width: '640px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: {
        propInfo: {
          propDef: cardRequest.prop.propDef,
          propType: cardRequest.propType,
        },
        title: 'Update cardinality',
        subtitle: `Set the cardinality for property ${cardRequest.prop.propDef.label}`,
        mode: 'updateCardinality',
        parentIri: this.resourceClass.id,
        currentCardinality: cardRequest.prop.cardinality,
        targetCardinality: cardRequest.targetCardinality,
        classProperties: currentOntologyPropertiesToDisplay,
      },
    };
    this.openEditDialog(dialogConfig);
  }

  /**
   * openEditDialog: Open the dialogue in order assign a property or change cardinalities
   * @param dialogConfig the MatDialogConfig
   * */
  openEditDialog(dialogConfig: MatDialogConfig) {
    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((event: DialogEvent) => {
      if (event !== DialogEvent.DialogCanceled) {
        // update the view: list of properties in resource class
        this.updatePropertyAssignment.emit(this.ontology.id);
      }
    });
  }

  /**
   * drag and drop property line
   */
  drop(event: CdkDragDrop<string[]>, currentOntologyPropertiesToDisplay: PropToDisplay[]) {
    // set sort order for child component
    moveItemInArray(
      currentOntologyPropertiesToDisplay, // TODO items should be updated in state if LoadProjectOntologiesAction is not executed after this
      event.previousIndex,
      event.currentIndex
    );

    if (event.previousIndex !== event.currentIndex) {
      this.updatePropertyAssignment.pipe(take(1)).subscribe(() => this.updatePropertyAssignment$.next());
      // the dropped property item has a new index (= gui order)
      // send the new gui-order to the api by
      // preparing the UpdateOntology object first
      this._store.dispatch(new ReplacePropertyAction(this.resourceClass, currentOntologyPropertiesToDisplay));
      this._actions$
        .pipe(ofActionSuccessful(ReplacePropertyAction))
        .pipe(take(1))
        .subscribe(() => {
          // successful request: update the view
          this.updatePropertyAssignment.emit(this.ontology.id);
          // display success message
          this._notification.openSnackBar(
            `You have successfully changed the order of properties in the resource class "${this.resourceClass.label}".`
          );
        });
    }
  }

  /**
   * opens resource instances in new tab using gravsearch
   * @param iri
   */
  openResourceInstances(iri: string) {
    // open resource instances in new tab:
    // it's important not to indent the gravsearch.
    const gravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .


} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <${iri}> .

}

OFFSET 0`;

    const doSearchRoute = `/${RouteConstants.search}/${RouteConstants.gravSearch}/${encodeURIComponent(gravsearch)}`;
    window.open(doSearchRoute, '_blank');
  }

  private getExistingProperties(classProps: PropToDisplay[], ontoProperties: OntologyProperties[]): PropToAdd[] {
    if (classProps.length === 0 || ontoProperties.length === 0) {
      return [];
    }

    const existingProperties: PropToAdd[] = [];
    const currentProjectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);
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
