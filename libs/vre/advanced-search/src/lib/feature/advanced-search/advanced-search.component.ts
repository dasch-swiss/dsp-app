import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { Constants } from '@dasch-swiss/dsp-js';
import { take } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { ApiData } from '../../data-access/advanced-search-service/advanced-search.service';
import {
  AdvancedSearchStoreService,
  ParentChildPropertyPair,
  OrderByItem,
  PropertyFormItem,
  PropertyFormListOperations,
  SearchItem,
  AdvancedSearchStateSnapshot,
} from '../../data-access/advanced-search-store/advanced-search-store.service';
import { ConfirmationDialogComponent } from '../../ui/dialog/confirmation-dialog/confirmation-dialog.component';
import { FormActionsComponent } from '../../ui/form-actions/form-actions.component';
import { OntologyResourceFormComponent } from '../../ui/ontology-resource-form/ontology-resource-form.component';
import { OrderByComponent } from '../../ui/order-by/order-by.component';
import { PropertyFormComponent } from '../../ui/property-form/property-form.component';

export interface QueryObject {
  query: string;
  properties: PropertyFormItem[];
}

@Component({
  selector: 'dasch-swiss-advanced-search',
  standalone: true,
  imports: [
    CommonModule,
    OrderByComponent,
    OntologyResourceFormComponent,
    PropertyFormComponent,
    FormActionsComponent,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [AdvancedSearchStoreService],
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  properties$ = this.store.properties$;
  propertiesLoading$ = this.store.propertiesLoading$;
  filteredProperties$ = this.store.filteredProperties$;
  searchButtonDisabled$ = this.store.searchButtonDisabled$;
  addButtonDisabled$ = this.store.addButtonDisabled$;
  resetButtonDisabled$ = this.store.resetButtonDisabled$;
  matchResourceClassesLoading$ = this.store.matchResourceClassesLoading$;
  resourcesSearchResultsLoading$ = this.store.resourcesSearchResultsLoading$;
  resourcesSearchResultsCount$ = this.store.resourcesSearchResultsCount$;
  resourcesSearchNoResults$ = this.store.resourcesSearchNoResults$;
  resourcesSearchResultsPageNumber$ =
    this.store.resourcesSearchResultsPageNumber$;
  resourcesSearchResults$ = this.store.resourcesSearchResults$;
  orderByButtonDisabled$ = this.store.orderByButtonDisabled$;

  constants = Constants;
  previousSearchObject: string | null = null;

  constructor(private _dialog: MatDialog) {}

  ngOnInit(): void {
    this.store.setState({
      ontologies: [],
      ontologiesLoading: false,
      resourceClasses: [],
      resourceClassesLoading: false,
      selectedProject: this.uuid
        ? 'http://rdfh.ch/projects/' + this.uuid
        : undefined,
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

    this.store.filteredPropertiesList(this.selectedResourceClass$);

    this.previousSearchObject = localStorage.getItem(
      'advanced-search-previous-search'
    );
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
    this.store.updatePropertyFormList(
      PropertyFormListOperations.Delete,
      property
    );
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

  handleSelectedMatchPropertyResourceClassChanged(
    property: PropertyFormItem
  ): void {
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
    const dialogRef = this._dialog.open(ConfirmationDialogComponent, {});

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.store.onReset();
      }
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

    const prevSearchObject: AdvancedSearchStateSnapshot = JSON.parse(
      this.previousSearchObject
    );

    this.store.setState({
      ontologies: prevSearchObject.ontologies,
      ontologiesLoading: false,
      resourceClasses: prevSearchObject.resourceClasses,
      resourceClassesLoading: false,
      selectedProject: prevSearchObject.selectedProject,
      selectedOntology: prevSearchObject.selectedOntology,
      selectedResourceClass: prevSearchObject.selectedResourceClass,
      propertyFormList: prevSearchObject.propertyFormList,
      properties: prevSearchObject.properties,
      propertiesLoading: false,
      propertiesOrderByList: prevSearchObject.propertiesOrderByList,
      filteredProperties: prevSearchObject.filteredProperties,
      matchResourceClassesLoading: false,
      resourcesSearchResultsLoading: false,
      resourcesSearchResultsCount: 0,
      resourcesSearchNoResults: false,
      resourcesSearchResultsPageNumber: 0,
      resourcesSearchResults: [],
    });
  }
}
