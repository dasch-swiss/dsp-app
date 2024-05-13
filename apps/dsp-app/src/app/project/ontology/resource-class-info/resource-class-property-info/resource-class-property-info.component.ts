import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import {
  CanDoResponse,
  Cardinality,
  ClassDefinition,
  Constants,
  IHasProperty,
  KnoraApiConnection,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
  UpdateOntology,
  UpdateResourceClassCardinality,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DefaultClass, DefaultProperty, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ListsSelectors, OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { DialogService } from '../../../../main/services/dialog.service';

// property data structure
export class Property {
  iri: string;
  label: string;
  type: DefaultProperty;
  multiple: boolean;
  required: boolean;
  guiAttr: string;

  constructor(iri?: string, label?: string, type?: any, multiple?: boolean, required?: boolean, guiAttr?: string) {
    this.iri = iri;
    this.label = label;
    this.type = type;
    this.multiple = multiple;
    this.required = required;
    this.guiAttr = guiAttr;
  }
}

export interface GuiCardinality {
  key: CardinalityKey;
  value: boolean;
}

type CardinalityKey = 'multiple' | 'required';

@Component({
  selector: 'app-resource-class-property-info',
  templateUrl: './resource-class-property-info.component.html',
  styleUrls: ['./resource-class-property-info.component.scss'],
})
export class ResourceClassPropertyInfoComponent implements OnInit, OnChanges, AfterContentInit, OnDestroy {
  @Input() propDef: ResourcePropertyDefinitionWithAllLanguages;

  @Input() propCard: IHasProperty;

  @Input() resourceIri?: string;

  @Input() projectUuid: string;

  @Input() lastModificationDate?: string;

  @Input() userCanEdit: boolean; // is user a project admin or sys admin?

  @Output() removePropertyFromClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();

  @Input() resourceClass: ClassDefinition;

  @Output() changeCardinalities: EventEmitter<{
    prop: IHasProperty;
    propType: DefaultProperty;
    targetCardinality: GuiCardinality;
  }> = new EventEmitter<{
    prop: IHasProperty;
    propType: DefaultProperty;
    targetCardinality: GuiCardinality;
  }>();

  isDestroyed = new Subject<void>();

  cardinalityControl: FormControl<Cardinality>;
  propInfo: Property = new Property();

  propType: DefaultProperty;

  propAttribute: string;
  propAttributeComment: string;

  propCanBeRemovedFromClass: boolean;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _ontoService: OntologyService,
    private _store: Store,
    private _fb: FormBuilder,
    private _cd: ChangeDetectorRef,
    private _dialog: DialogService
  ) {}

  ngOnInit() {
    this.cardinalityControl = this._fb.control<Cardinality>(this.propCard.cardinality);
  }

  afterCardinalityChange(newValue: Cardinality) {
    this._dialog
      .afterConfirmation('Please note that this change may not be reversible. Do you wish to continue ?', 'Attention')
      .pipe(switchMap(() => this.submitCardinalitiesChange()))
      .subscribe(() => {
        this.cardinalityControl.patchValue(newValue);
      });
  }

  ngOnChanges(): void {
    // set the cardinality values in the class view
    const cards = this._ontoService.getCardinalityGuiValues(this.propCard.cardinality);
    this.propInfo.multiple = cards.multiple;
    this.propInfo.required = cards.required;
    const currentProjectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);

    // get info about subproperties, if they are not a subproperty of knora base ontology
    // in this case add it to the list of subproperty iris
    const superProp = this._ontoService.getSuperProperty(this.propDef, currentProjectOntologies);
    if (superProp) {
      if (this.propDef.subPropertyOf.indexOf(superProp) === -1) {
        this.propDef.subPropertyOf.push(superProp);
      }
    }

    // get the default property type for this property
    this._ontoService.getDefaultPropType(this.propDef).subscribe((prop: DefaultProperty) => {
      this.propType = prop;
    });
  }

  ngAfterContentInit() {
    // get current ontology to get linked res class information
    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    const currentProjectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);
    if (ontology && currentProjectOntologies && this.propDef.isLinkProperty) {
      // this property is a link property to another resource class
      // get the base ontology of object type
      const baseOnto = this.propDef.objectType.split('#')[0];
      if (baseOnto !== ontology.id) {
        // get class info from another ontology
        const onto = currentProjectOntologies.find(i => i.id === baseOnto);
        if (!onto) {
          if (this.propDef.objectType === Constants.Region) {
            this.propAttribute = 'Region';
          } // else no ontology found
        } else {
          this.propAttribute = onto.classes[this.propDef.objectType].label;
          this.propAttributeComment = onto.classes[this.propDef.objectType].comment;
        }
      } else {
        this.propAttribute = ontology.classes[this.propDef.objectType].label;
        this.propAttributeComment = ontology.classes[this.propDef.objectType].comment;
      }
    }

    // get current ontology lists to get linked list information
    this._store
      .select(ListsSelectors.listsInProject)
      .pipe(takeUntil(this.isDestroyed))
      .subscribe(currentOntologyLists => {
        if (currentOntologyLists && this.propDef.objectType === Constants.ListValue) {
          // this property is a list property
          const re = /\<([^)]+)\>/;
          const listIri = this.propDef.guiAttributes[0].match(re)[1];
          const listUrl = `/project/${this.projectUuid}/list/${listIri.split('/').pop()}`;
          const list = currentOntologyLists.find(i => i.id === listIri);
          if (list) {
            this.propAttribute = `<a href="${listUrl}">${list.labels[0].value}</a>`;
            this.propAttributeComment = list.comments.length ? list.comments[0].value : null;
          }
        }
      });
  }

  /**
   * determines whether a property can be removed from a class or not
   */
  canBeRemovedFromClass(): void {
    // check if the property can be removed from res class
    if (!this.lastModificationDate) {
      // guard
      return;
    }

    // property can only be removed from class if it's not inherited from another prop or class
    if (this.propCard.isInherited) {
      // other guard
      this.propCanBeRemovedFromClass = false;
      return;
    }
    const onto = new UpdateOntology<UpdateResourceClassCardinality>();

    onto.lastModificationDate = this.lastModificationDate;

    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
    onto.id = ontology.id;

    const delCard = new UpdateResourceClassCardinality();

    delCard.id = this.resourceIri;

    delCard.cardinalities = [];

    delCard.cardinalities = [this.propCard];
    onto.entity = delCard;

    this._dspApiConnection.v2.onto.canDeleteCardinalityFromResourceClass(onto).subscribe((canDoRes: CanDoResponse) => {
      this.propCanBeRemovedFromClass = canDoRes.canDo;
      this._cd.markForCheck();
    });
  }

  submitCardinalitiesChange() {
    const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);

    // get the ontology, the class and its properties
    const classUpdate = new UpdateOntology<UpdateResourceClassCardinality>();
    classUpdate.lastModificationDate = this.lastModificationDate;
    classUpdate.id = ontology.id;
    const changedClass = new UpdateResourceClassCardinality();
    changedClass.id = this.resourceIri; // TODO this.resClassIri;
    changedClass.cardinalities = [this.propCard]; // TODO might be wrong

    // get the property for replacing the cardinality
    const idx = changedClass.cardinalities.findIndex(c => c.propertyIndex === this.propDef.id);
    changedClass.cardinalities[idx].cardinality = this.cardinalityControl.value;

    classUpdate.entity = changedClass;
    return this._dspApiConnection.v2.onto.replaceCardinalityOfResourceClass(classUpdate).pipe(
      tap((res: ResourceClassDefinitionWithAllLanguages) => {
        this.lastModificationDate = res.lastModificationDate;
      })
    );
  }

  ngOnDestroy() {
    this.isDestroyed.next();
    this.isDestroyed.complete();
  }
}
