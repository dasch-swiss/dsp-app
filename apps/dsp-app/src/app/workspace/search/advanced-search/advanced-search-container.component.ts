import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QueryObject, PropertyFormItem } from '@dasch-swiss/vre/advanced-search';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';

@Component({
  selector: 'app-advanced-search-container',
  templateUrl: './advanced-search-container.component.html',
  styleUrls: ['./advanced-search-container.component.scss'],
})
export class AdvancedSearchContainerComponent implements OnInit {
  uuid: string;

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _location: Location,
    private _loggingService: AppLoggingService
  ) {}

  ngOnInit(): void {
    this.uuid = this._route.parent.snapshot.params.uuid;
  }

  onSearch(queryObject: QueryObject): void {
    this.logProperties(queryObject.properties);

    const route = `./${RouteConstants.advancedSearch}/${RouteConstants.gravSearch}/${encodeURIComponent(
      queryObject.query
    )}`;

    this._router.navigate([route], { relativeTo: this._route.parent });
  }

  onBackClicked(): void {
    this._location.back();
  }

  // send the list of properties searched for to Datadog
  // locally the logging service will just print to the console
  logProperties(propFormList: PropertyFormItem[]): void {
    // strip any irrelevant data from the PropertyFormList for logging
    const logObject = propFormList.map(propertyForm => {
      let valueObject: object | undefined;
      if (Array.isArray(propertyForm.searchValue)) {
        valueObject = propertyForm.searchValue.map(v => ({
          property: v.selectedProperty,
          operator: v.selectedOperator,
          value: v.searchValue,
        }));
      }
      return {
        property: propertyForm.selectedProperty,
        operator: propertyForm.selectedOperator,
        value: valueObject || propertyForm.searchValue,
      };
    });

    this._loggingService.info('Search properties', logObject);
  }
}
