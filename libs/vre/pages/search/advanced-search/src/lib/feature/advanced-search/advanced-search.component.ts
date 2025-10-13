import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Constants } from '@dasch-swiss/dsp-js';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { take } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ApiData } from '../../data-access/advanced-search-service/advanced-search.service';
import {
  AdvancedSearchStateSnapshot,
  AdvancedSearchStoreService,
  OrderByItem,
  ParentChildPropertyPair,
  PropertyFormItem,
  PropertyFormListOperations,
  SearchItem,
} from '../../data-access/advanced-search-store/advanced-search-store.service';
import { FormActionsComponent } from '../../ui/form-actions/form-actions.component';
import { OntologyResourceFormComponent } from '../../ui/ontology-resource-form/ontology-resource-form.component';
import { OrderByComponent } from '../../ui/order-by/order-by.component';
import { PropertyFormComponent } from '../../ui/property-form/property-form.component';

export interface QueryObject {
  query: string;
  properties: PropertyFormItem[];
}

@Component({
  selector: 'app-advanced-search',
  imports: [
    CommonModule,
    OrderByComponent,
    OntologyResourceFormComponent,
    PropertyFormComponent,
    FormActionsComponent,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    TranslateModule,
  ],
  providers: [AdvancedSearchStoreService],
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class AdvancedSearchComponent implements OnInit {
  // either the uuid of the project or the shortcode
  // new projects use uuid, old projects use shortcode
  @Input() uuid: string | undefined = undefined;

  @Output() emitGravesearchQuery = new EventEmitter<QueryObject>();
  @Output() emitBackButtonClicked = new EventEmitter<void>();

  store: AdvancedSearchStoreService = inject(AdvancedSearchStoreService);
  route: ActivatedRoute = inject(ActivatedRoute);

  ontologies$ = this.store.ontologies$;
  ontologiesLoading$ = this.store.ontologiesLoading$;
  resourceClasses$ = this.store.resourceClasses$;
  resourceClassesLoading$ = this.store.resourceClassesLoading$;
  selectedProject$ = this.store.selectedProject$;
  selectedOntology$ = this.store.selectedOntology$;
  selectedResourceClass$ = this.store.selectedResourceClass$;
  propertyFormList$ = this.store.propertyFormList$;
  propertiesOrderByList$ = this.store.propertiesOrderByList$;
  propertiesLoading$ = this.store.propertiesLoading$;
  filteredProperties$ = this.store.filteredProperties$;
  searchButtonDisabled$ = this.store.searchButtonDisabled$;
  addButtonDisabled$ = this.store.addButtonDisabled$;
  resetButtonDisabled$ = this.store.resetButtonDisabled$;
  matchResourceClassesLoading$ = this.store.matchResourceClassesLoading$;
  resourcesSearchResultsLoading$ = this.store.resourcesSearchResultsLoading$;
  resourcesSearchResultsCount$ = this.store.resourcesSearchResultsCount$;
  resourcesSearchNoResults$ = this.store.resourcesSearchNoResults$;
  resourcesSearchResultsPageNumber$ = this.store.resourcesSearchResultsPageNumber$;
  resourcesSearchResults$ = this.store.resourcesSearchResults$;
  orderByButtonDisabled$ = this.store.orderByButtonDisabled$;

  constants = Constants;
  previousSearchObject: AdvancedSearchStateSnapshot | null = null;

  constructor(private _dialogService: DialogService) {}

  ngOnInit(): void {
    const projectIri = `http://rdfh.ch/projects/${this.uuid}`;
    this.store.setState({
      ontologies: [],
      ontologiesLoading: false,
      resourceClasses: [],
      resourceClassesLoading: false,
      selectedProject: this.uuid ? projectIri : undefined,
      selectedOntology: undefined,
      selectedResourceClass: undefined,
      propertyFormList: [],
      properties: [],
      propertiesLoading: false,
      propertiesOrderByList: [],
      filteredProperties: [],
      matchResourceClassesLoading: false,
      resourcesSearchResultsLoading: false,
      resourcesSearchResultsCount: 0,
      resourcesSearchNoResults: false,
      resourcesSearchResultsPageNumber: 0,
      resourcesSearchResults: [],
    });

    this.store.ontologiesList(this.selectedProject$);

    this.store.resourceClassesList(this.selectedOntology$);

    this.store.propertiesList(this.selectedOntology$);

    this.store.filteredPropertiesList();

    const searchStored = localStorage.getItem('advanced-search-previous-search');
    if (searchStored) {
      this.previousSearchObject = JSON.parse(searchStored)[projectIri];
    }
  }

  // pass-through method to notify the store to update the state of the selected ontology
  handleSelectedOntology(ontology: ApiData): void {
    this.store.updateSelectedOntology(ontology);
  }

  // pass-through method to notify the store to update the state of the selected resource class
  handleSelectedResourceClass(resourceClass: ApiData): void {
    this.store.updateSelectedResourceClass(resourceClass);
  }

  handleAddPropertyForm(): void {
    const uuid = uuidv4();

    this.store.updatePropertyFormList(PropertyFormListOperations.Add, {
      id: uuid,
      selectedProperty: undefined,
      selectedOperator: undefined,
      searchValue: undefined,
      operators: [],
      list: undefined,
    });
  }

  handleRemovePropertyForm(property: PropertyFormItem): void {
    this.store.updatePropertyFormList(PropertyFormListOperations.Delete, property);
  }

  handleSelectedPropertyChanged(property: PropertyFormItem): void {
    if (
      property.selectedProperty?.objectType !== Constants.Label &&
      !property.selectedProperty?.objectType.includes(this.constants.KnoraApiV2)
    ) {
      // reset the search results
      this.store.resetResourcesSearchResults();
    }
    this.store.updateSelectedProperty(property);
  }

  handleSelectedOperatorChanged(property: PropertyFormItem): void {
    this.store.updateSelectedOperator(property);
  }

  handleSelectedMatchPropertyResourceClassChanged(property: PropertyFormItem): void {
    this.store.updateSelectedMatchPropertyResourceClass(property);
  }

  handleSearchValueChanged(property: PropertyFormItem): void {
    this.store.updateSearchValue(property);
  }

  handleResourceSearchValueChanged(searchItem: SearchItem): void {
    this.store.updateResourcesSearchResults(searchItem);
  }

  handleLoadMoreSearchResults(searchItem: SearchItem): void {
    this.store.loadMoreResourcesSearchResults(searchItem);
  }

  handlePropertyOrderByChanged(orderByList: OrderByItem[]): void {
    this.store.updatePropertyOrderBy(orderByList);
  }

  handleSearchButtonClicked(): void {
    this.propertyFormList$.pipe(take(1)).subscribe(propertyFormList => {
      const queryObject: QueryObject = {
        query: this.store.onSearch(),
        properties: propertyFormList,
      };

      this.emitGravesearchQuery.emit(queryObject);
    });
  }

  handleResetButtonClicked(): void {
    this._dialogService.afterConfirmation('Are you sure you want to reset the form?').subscribe(() => {
      this.store.onReset();
    });
  }

  handleBackButtonClicked(): void {
    this.emitBackButtonClicked.emit();
  }

  handleAddChildPropertyForm(property: PropertyFormItem): void {
    this.store.addChildPropertyFormList(property);
  }

  handleRemoveChildPropertyForm(property: ParentChildPropertyPair): void {
    this.store.deleteChildPropertyFormList(property);
  }

  handleChildSelectedPropertyChanged(property: ParentChildPropertyPair): void {
    this.store.updateChildSelectedProperty(property);
  }

  handleChildSelectedOperatorChanged(property: ParentChildPropertyPair): void {
    this.store.updateChildSelectedOperator(property);
  }

  handleChildValueChanged(property: ParentChildPropertyPair): void {
    this.store.updateChildSearchValue(property);
  }

  loadPreviousSearch(): void {
    if (!this.previousSearchObject) return;

    this.store.setState({
      ontologies: this.previousSearchObject.ontologies,
      ontologiesLoading: false,
      resourceClasses: this.previousSearchObject.resourceClasses,
      resourceClassesLoading: false,
      selectedProject: this.previousSearchObject.selectedProject,
      selectedOntology: this.previousSearchObject.selectedOntology,
      selectedResourceClass: this.previousSearchObject.selectedResourceClass,
      propertyFormList: this.previousSearchObject.propertyFormList,
      properties: this.previousSearchObject.properties,
      propertiesLoading: false,
      propertiesOrderByList: this.previousSearchObject.propertiesOrderByList,
      filteredProperties: this.previousSearchObject.filteredProperties,
      matchResourceClassesLoading: false,
      resourcesSearchResultsLoading: false,
      resourcesSearchResultsCount: 0,
      resourcesSearchNoResults: false,
      resourcesSearchResultsPageNumber: 0,
      resourcesSearchResults: [],
    });
  }
}
