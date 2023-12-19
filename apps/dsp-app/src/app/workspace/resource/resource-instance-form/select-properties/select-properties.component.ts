import { Component, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import {
  Cardinality,
  CardinalityUtil,
  IHasProperty,
  ReadResource,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';
import { ValueService } from '../../services/value.service';
import { SwitchPropertiesComponent } from './switch-properties/switch-properties.component';

@Component({
  selector: 'app-select-properties',
  templateUrl: './select-properties.component.html',
  styleUrls: ['./select-properties.component.scss'],
})
export class SelectPropertiesComponent implements OnInit {
  @ViewChildren('switchProp')
  switchPropertiesComponent: QueryList<SwitchPropertiesComponent>;

  @ViewChild('createVal') createValueComponent: BaseValueDirective;

  @Input() properties: ResourcePropertyDefinition[];

  @Input() ontologyInfo: ResourceClassAndPropertyDefinitions;

  @Input() selectedResourceClass: ResourceClassDefinition;

  @Input() parentForm: UntypedFormGroup;

  @Input() currentOntoIri: string;

  parentResource = new ReadResource();

  index = 0;

  propertyValuesKeyValuePair = {}; // { [index: string]: [number] }

  addButtonIsVisible: boolean;

  isRequiredProp: boolean;

  constructor(private _valueService: ValueService) {}

  ngOnInit() {
    if (this.properties) {
      for (const prop of this.properties) {
        if (prop) {
          if (prop.objectType === 'http://api.knora.org/ontology/knora-api/v2#TextValue') {
            prop.objectType = this._valueService.getTextValueClass(prop);
          }

          // each property will have at least one value so add one by default
          this.propertyValuesKeyValuePair[prop.id] = [0];

          // each property will also have a filtered array to be used when deleting a value.
          // see the deleteValue method below for more info
          this.propertyValuesKeyValuePair[prop.id + '-filtered'] = [0];

          // each property will also have a cardinality array to be used when marking a field as required
          // see the isPropRequired method below for more info
          this.isPropRequired(prop.id);
          this.propertyValuesKeyValuePair[prop.id + '-cardinality'] = [this.isRequiredProp ? 1 : 0];
        }
      }
    }

    this.parentResource.entityInfo = this.ontologyInfo;
  }

  /**
   * given a resource property, check if an add button should be displayed under the property values
   *
   * @param prop the resource property
   */
  addValueIsAllowed(prop: ResourcePropertyDefinition): boolean {
    return CardinalityUtil.createValueForPropertyAllowed(
      prop.id,
      this.propertyValuesKeyValuePair[prop.id].length,
      this.ontologyInfo.classes[this.selectedResourceClass.id]
    );
  }

  /**
   * check the cardinality of a property
   * If the cardinality is 1 or 1-N, the property will be marked as required
   * If the cardinality is 0-1 or 0-N, the property will not be required
   *
   * @param propId property id
   */
  isPropRequired(propId: string): boolean {
    if (this.selectedResourceClass !== undefined && propId) {
      this.selectedResourceClass.propertiesList.filter((card: IHasProperty) => {
        if (card.propertyIndex === propId) {
          // cardinality 1 or 1-N
          if (card.cardinality === Cardinality._1 || card.cardinality === Cardinality._1_n) {
            this.isRequiredProp = true;
          } else {
            // cardinality 0-1 or 0-N
            this.isRequiredProp = false;
          }
        }
      });
      return this.isRequiredProp;
    }
  }

  /**
   * called from the template when the user clicks on the add button
   */
  addNewValueFormToProperty(prop: ResourcePropertyDefinition, ev: Event) {
    ev.preventDefault();

    // get the length of the corresponding property values array
    const length = this.propertyValuesKeyValuePair[prop.id].length;

    // add a new element to the corresponding property values array.
    // conveniently, we can use the length of the array to add the next number in the sequence
    this.propertyValuesKeyValuePair[prop.id].push(length);

    // add a new element to the corresponding filtered property values array as well.
    // if this array contains more than one element, the delete button with be shown
    this.propertyValuesKeyValuePair[prop.id + '-filtered'].push(length);
  }

  deleteValue(prop: ResourcePropertyDefinition, index: number, ev: Event) {
    ev.preventDefault();
    // don't actually remove the item from the property values array, just set it to undefined.
    // this is because if we actually modify the indexes of the array, the template will re-evaluate
    // and recreate components for any elements after the deleted index, effectively erasing entered data if any was entered
    this.propertyValuesKeyValuePair[prop.id][index] = undefined;

    // update the filtered version of the corresponding property values array.
    // used in the template to calculate if the delete button should be shown.
    // i.e. don't show the delete button if there is only one value
    this.propertyValuesKeyValuePair[prop.id + '-filtered'] = this._filterValueArray(
      this.propertyValuesKeyValuePair[prop.id]
    );
  }

  /**
   * given an array of numbers, returns a filtered list with no undefined elements
   *
   * @param arrayToFilter an array of number containing undefined elements you wish to filter
   */
  private _filterValueArray(arrayToFilter: number[]): number[] {
    arrayToFilter = arrayToFilter.filter(element => element !== undefined);

    return arrayToFilter;
  }
}
