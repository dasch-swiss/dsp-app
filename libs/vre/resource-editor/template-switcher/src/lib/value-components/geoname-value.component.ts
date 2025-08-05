import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, switchMap } from 'rxjs';
import { GeonameService, SearchPlace } from '../geoname.service';

@Component({
  selector: 'app-geoname-value',
  template: ` <mat-form-field style="width: 100%">
    <input
      matInput
      [formControl]="control"
      type="text"
      [placeholder]="'e.g. Basel'"
      aria-label="geoname"
      data-cy="geoname-autocomplete"
      [matAutocomplete]="auto" />
    <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayPlaceInSearch.bind(this)">
      <mat-option *ngFor="let place of places" [value]="place.id"> {{ place?.displayName }}</mat-option>
    </mat-autocomplete>
    <mat-error *ngIf="control.errors as errors">
      {{ errors | humanReadableError }}
    </mat-error>
  </mat-form-field>`,
})
export class GeonameValueComponent implements OnInit {
  @Input({ required: true }) control!: FormControl<string>;
  places: SearchPlace[] = [];

  constructor(
    private _geonameService: GeonameService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.control.value) {
      this._geonameService.resolveGeonameID(this.control.value).subscribe(place => {
        this.places = [
          {
            ...place,
            id: this.control.value,
            locationType: '',
          },
        ];
      });
    }

    this.control.valueChanges
      .pipe(
        debounceTime(300),
        switchMap((searchTerm: string) => this._geonameService.searchPlace(searchTerm))
      )
      .subscribe(places => {
        this.places = places;
        this._cdr.detectChanges();
      });
  }

  displayPlaceInSearch(placeId: string) {
    const geoPlace = this.places.find(place => place.id === placeId);
    return geoPlace ? geoPlace.displayName : '';
  }
}
