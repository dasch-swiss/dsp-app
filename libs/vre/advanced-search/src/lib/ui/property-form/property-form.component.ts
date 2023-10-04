import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
    ParentChildPropertyPair,
    PropertyFormItem,
    SearchItem,
} from '../../data-access/advanced-search-store/advanced-search-store.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
    MatSelect,
    MatSelectChange,
    MatSelectModule,
} from '@angular/material/select';
import {
    PropertyData,
    ApiData,
    ResourceLabelObject,
} from '../../data-access/advanced-search-service/advanced-search.service';
import { Operators } from '../../data-access/advanced-search-store/advanced-search-store.service';
import { PropertyFormValueComponent } from './property-form-value/property-form-value.component';
import { PropertyFormLinkValueComponent } from './property-form-link-value/property-form-link-value.component';
import { Constants } from '@dasch-swiss/dsp-js';
import { PropertyFormListValueComponent } from './property-form-list-value/property-form-list-value.component';
import { PropertyFormLinkMatchPropertyComponent } from './property-form-link-match-property/property-form-link-match-property.component';

@Component({
    selector: 'dasch-swiss-property-form',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        PropertyFormValueComponent,
        PropertyFormLinkValueComponent,
        PropertyFormLinkMatchPropertyComponent,
        PropertyFormListValueComponent,
    ],
    providers: [MatSelect],
    templateUrl: './property-form.component.html',
    styleUrls: ['./property-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFormComponent {
    @Input() propertyFormItem: PropertyFormItem = {
        id: '',
        selectedProperty: undefined,
        selectedOperator: undefined,
        searchValue: undefined,
        operators: [],
        list: undefined,
    };
    @Input() matchResourceClassesLoading: boolean | null = false;
    @Input() resourcesSearchResultsLoading: boolean | null = false;
    @Input() resourcesSearchResultsCount: number | null = 0;
    @Input() resourcesSearchResults: ApiData[] | null = [];
    @Input() resourcesSearchNoResults: boolean | null = false;

    // this can contain either a list of all properties of an ontology
    // OR
    // a list of properties filtered by a resource class
    @Input() properties: PropertyData[] | null = [];
    @Input() propertiesLoading: boolean | null = false;

    @Output() emitRemovePropertyForm = new EventEmitter<PropertyFormItem>();
    @Output() emitSelectedPropertyChanged = new EventEmitter<PropertyFormItem>();
    @Output() emitSelectedOperatorChanged = new EventEmitter<PropertyFormItem>();
    @Output() emitSelectedMatchPropertyResourceClassChanged = new EventEmitter<PropertyFormItem>();
    @Output() emitSearchValueChanged = new EventEmitter<PropertyFormItem>();
    @Output() emitResourceSearchValueChanged = new EventEmitter<SearchItem>();
    @Output() emitLoadMoreSearchResults = new EventEmitter<SearchItem>();
    @Output() emitAddChildPropertyForm = new EventEmitter<PropertyFormItem>();
    @Output() emitRemoveChildPropertyForm = new EventEmitter<ParentChildPropertyPair>();
    @Output() emitChildSelectedPropertyChanged = new EventEmitter<ParentChildPropertyPair>();
    @Output() emitChildSelectedOperatorChanged = new EventEmitter<ParentChildPropertyPair>();
    @Output() emitChildValueChanged = new EventEmitter<ParentChildPropertyPair>();

    @ViewChild('operatorsList') operatorsList!: MatSelect;
    @ViewChild('propertyFormValue') propertyFormValueComponent!: PropertyFormValueComponent;

    operators = Operators; // in order to use it in the template
    constants = Constants;

    // objectType is manually set so that it uses the KnoraApiV2 string for boolean checks later
    resourceLabelObj = ResourceLabelObject;

    onRemovePropertyFormClicked(propFormItem: PropertyFormItem | null): void {
        if (propFormItem) {
            this.emitRemovePropertyForm.emit(propFormItem);
        }
    }

    onSelectedPropertyChanged(event: MatSelectChange): void {
        const propFormItem = this.propertyFormItem;
        if (propFormItem) {
            propFormItem.selectedProperty = event.value;

            // this isn't great but we need to reset the value of the input control
            // because the input will not clear itself if the input switches to an input of the same type
            // i.e. from an integer input to a decimal input, the entered integer value will remain in the input
            if(this.propertyFormValueComponent) {
                this.propertyFormValueComponent.inputControl.setValue('');
            }

            // when the selected property changes, we need to reset the selected operator in the UI
            // because the selected operator might not be valid for the new selected property
            if(this.operatorsList) {
                this.operatorsList.value = undefined;
            }

            this.emitSelectedPropertyChanged.emit(propFormItem);
        }
    }

    onSelectedOperatorChanged(event: MatSelectChange): void {
        const propFormItem = this.propertyFormItem;
        if (propFormItem) {
            propFormItem.selectedOperator = event.value;
            this.emitSelectedOperatorChanged.emit(propFormItem);
        }
    }

    onSelectedMatchPropertyResourceClassChanged(event: MatSelectChange): void {
        const propFormItem = this.propertyFormItem;
        if (propFormItem) {
            propFormItem.selectedMatchPropertyResourceClass = event.value;
            this.emitSelectedMatchPropertyResourceClassChanged.emit(propFormItem);
        }
    }

    onValueChanged(value: string | PropertyFormItem[]) {
        const propFormItem = this.propertyFormItem;
        if (propFormItem) {
            propFormItem.searchValue = value;
            this.emitSearchValueChanged.emit(propFormItem);
        }
    }

    onResourceSearchValueChanged(searchValue: string) {
        const propFormItem = this.propertyFormItem;
        if (propFormItem && propFormItem.selectedProperty) {
            this.emitResourceSearchValueChanged.emit({
                value: searchValue,
                objectType: propFormItem.selectedProperty?.objectType,
            });
        }
    }

    onLoadMoreSearchResults(searchValue: string) {
        const propFormItem = this.propertyFormItem;
        if (propFormItem && propFormItem.selectedProperty) {
            this.emitLoadMoreSearchResults.emit({
                value: searchValue,
                objectType: propFormItem.selectedProperty?.objectType,
            });
        }
    }

    onChildLoadMoreSearchResults(searchItem: SearchItem): void {
        this.emitLoadMoreSearchResults.emit(searchItem);
    }

    onAddChildPropertyFormClicked(): void {
        const propFormItem = this.propertyFormItem;
        this.emitAddChildPropertyForm.emit(propFormItem);
    }

    onRemoveChildPropertyFormClicked(childProperty: PropertyFormItem) {
        this.emitRemoveChildPropertyForm.emit({parentProperty: this.propertyFormItem, childProperty: childProperty});
    }

    onChildSelectedPropertyChanged(childProperty: PropertyFormItem): void {
        this.emitChildSelectedPropertyChanged.emit({parentProperty: this.propertyFormItem, childProperty: childProperty});
    }

    onChildSelectedOperatorChanged(childProperty: PropertyFormItem): void {
        this.emitChildSelectedOperatorChanged.emit({parentProperty: this.propertyFormItem, childProperty: childProperty});
    }

    onChildValueChanged(childProperty: PropertyFormItem): void {
        this.emitChildValueChanged.emit({parentProperty: this.propertyFormItem, childProperty: childProperty});
    }

    onChildResourceSearchValueChanged(searchValue: SearchItem) {
        this.emitResourceSearchValueChanged.emit(searchValue);
    }

    // get the list of child properties of a linked resource
    getLinkMatchPropertyFormItems(value: string | PropertyFormItem[] | undefined): PropertyFormItem[] | undefined {
        if (Array.isArray(value)) {
          return value;
        } else {
          return undefined;
        }
      }
}
