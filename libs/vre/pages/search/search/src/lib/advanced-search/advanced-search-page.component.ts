import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { PropertyFormItem, QueryObject } from '@dasch-swiss/vre/pages/search/advanced-search';

@Component({
  selector: 'app-advanced-search-page',
  template: ` <app-centered-layout>
    <app-advanced-search
      [uuid]="uuid"
      (emitGravesearchQuery)="onSearch($event)"
      (emitBackButtonClicked)="onBackClicked()" />
  </app-centered-layout>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdvancedSearchPageComponent implements OnInit {
  uuid: string;

  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _location: Location
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
  }
}
