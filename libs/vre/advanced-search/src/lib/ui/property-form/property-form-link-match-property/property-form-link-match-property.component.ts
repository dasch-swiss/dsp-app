import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelect, MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Constants } from '@dasch-swiss/dsp-js';
import {
  ApiData,
  PropertyData,
  ResourceLabelObject,
} from '../../../data-access/advanced-search-service/advanced-search.service';
import {
  Operators,
  PropertyFormItem,
  SearchItem,
} from '../../../data-access/advanced-search-store/advanced-search-store.service';
import { PropertyFormLinkValueComponent } from '../property-form-link-value/property-form-link-value.component';
import { PropertyFormListValueComponent } from '../property-form-list-value/property-form-list-value.component';
import { PropertyFormValueComponent } from '../property-form-value/property-form-value.component';

@Component({
  selector: 'dasch-swiss-property-form-link-match-property',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    PropertyFormValueComponent,
    PropertyFormListValueComponent,
    PropertyFormLinkValueComponent,
  ],
  templateUrl: './property-form-link-match-property.component.html',
  styleUrls: ['./property-form-link-match-property.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFormLinkMatchPropertyComponent implements AfterViewInit {
  @Input() values: PropertyFormItem[] | undefined = [];
  @Input() properties: PropertyData[] | undefined = [];
  @Input() resourcesSearchResultsLoading: boolean | null = false;
  @Input() resourcesSearchResultsCount: number | null = 0;
  @Input() resourcesSearchResults: ApiData[] | null = [];
  @Input() resourcesSearchNoResults: boolean | null = false;

  @Output() emitAddPropertyForm = new EventEmitter<void>();
  @Output() emitRemovePropertyForm = new EventEmitter<PropertyFormItem>();
  @Output() emitSelectedPropertyChanged = new EventEmitter<PropertyFormItem>();
  @Output() emitSelectedOperatorChanged = new EventEmitter<PropertyFormItem>();
  @Output() emitValueChanged = new EventEmitter<PropertyFormItem>();
  @Output() emitResourceSearchValueChanged = new EventEmitter<SearchItem>();
  @Output() emitLoadMoreSearchResults = new EventEmitter<SearchItem>();

  @ViewChildren('propertiesList') propertiesList!: QueryList<MatSelect>;
  @ViewChildren('operatorsList') operatorsList!: QueryList<MatSelect>;
  @ViewChild('propertyFormValue')
  propertyFormValueComponent!: PropertyFormValueComponent;

  operators = Operators; // in order to use it in the template
  constants = Constants;

  // objectType is manually set so that it uses the KnoraApiV2 string for boolean checks later
  resourceLabelObj = ResourceLabelObject;

  ngAfterViewInit(): void {
    if (this.propertiesList && this.values?.length) {
      this.values.forEach((value, index) => {
        this.propertiesList.toArray()[index].value = value.selectedProperty;
      });
    }

    if (this.operatorsList && this.values?.length) {
      this.values.forEach((value, index) => {
        this.operatorsList.toArray()[index].value = value.selectedOperator;
      });
    }
  }

  onAddPropertyFormClicked(): void {
    if (this.values) {
      this.emitAddPropertyForm.emit();
    }
  }

  onRemovePropertyFormClicked(propFormItem: PropertyFormItem): void {
    if (propFormItem) {
      this.emitRemovePropertyForm.emit(propFormItem);
    }
  }

  onSelectedPropertyChanged(event: MatSelectChange, index: number): void {
    if (this.values) {
      this.values[index].selectedProperty = event.value;

      // when the selected property changes, we need to reset the selected operator at the specified index in the UI
      // because the selected operator might not be valid for the new selected property
      if (this.operatorsList.length) {
        this.operatorsList.toArray()[index].value = undefined;
      }

      this.emitSelectedPropertyChanged.emit(this.values[index]);
    }
  }

  onSelectedOperatorChanged(event: MatSelectChange, index: number): void {
    if (this.values) {
      this.values[index].selectedOperator = event.value;
      this.emitSelectedOperatorChanged.emit(this.values[index]);
    }
  }

  onValueChanged(value: string | ApiData, index: number): void {
    if (this.values) {
      if (this._isApiData(value)) {
        this.values[index].searchValue = value.iri;
        this.values[index].searchValueLabel = value.label;
      } else {
        this.values[index].searchValue = value;
      }
      this.emitValueChanged.emit(this.values[index]);
    }
  }

  onResourceSearchValueChanged(value: string, index: number): void {
    if (this.values) {
      const objectType = this.values[index].selectedProperty?.objectType;
      if (objectType) {
        this.emitResourceSearchValueChanged.emit({
          value: value,
          objectType: objectType,
        });
      }
    }
  }

  onLoadMoreSearchResults(value: string, index: number): void {
    if (this.values) {
      const objectType = this.values[index].selectedProperty?.objectType;
      if (objectType) {
        this.emitLoadMoreSearchResults.emit({
          value: value,
          objectType: objectType,
        });
      }
    }
  }

  compareObjects(object1: PropertyData | ApiData, object2: PropertyData | ApiData) {
    return object1 && object2 && object1.iri == object2.iri;
  }

  // Type guard function to check if the value adheres to ApiData interface
  _isApiData(value: any): value is ApiData {
    return value && typeof value === 'object' && 'iri' in value && 'label' in value;
  }
}
