import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, switchMap, tap } from 'rxjs';
import { GeonameService, SearchPlace } from '../geoname.service';

@Component({
  selector: 'app-geoname-value',
  imports: [
    MatFormField,
    MatInput,
    ReactiveFormsModule,
    TranslateModule,
    MatAutocompleteTrigger,
    MatSuffix,
    MatProgressSpinner,
    MatAutocomplete,
    MatOption,
    MatError,
    HumanReadableErrorPipe,
  ],
  template: ` <mat-form-field style="width: 100%">
    <input
      matInput
      [formControl]="control"
      type="text"
      [placeholder]="'resourceEditor.templateSwitcher.geonameValue.placeholder' | translate"
      [attr.aria-label]="'resourceEditor.templateSwitcher.geonameValue.label' | translate"
      data-cy="geoname-autocomplete"
      [matAutocomplete]="auto" />
    @if (loading) {
      <mat-progress-spinner matSuffix mode="indeterminate" diameter="20" style="margin-right: 16px;" />
    }
    <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayPlaceInSearch.bind(this)">
      @for (place of places; track place) {
        <mat-option [value]="place.id"> {{ place?.displayName }}</mat-option>
      }
    </mat-autocomplete>
    @if (control.errors; as errors) {
      <mat-error>
        {{ errors | humanReadableError }}
      </mat-error>
    }
  </mat-form-field>`,
})
export class GeonameValueComponent implements OnInit {
  @Input({ required: true }) control!: FormControl<string>;
  places: SearchPlace[] = [];

  loading = false;
  constructor(
    private readonly _geonameService: GeonameService,
    private readonly _cdr: ChangeDetectorRef
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
        tap(() => {
          this.loading = true;
        }),
        switchMap((searchTerm: string) => this._geonameService.searchPlace(searchTerm))
      )
      .subscribe(places => {
        this.loading = false;
        this.places = places;
        this._cdr.detectChanges();
      });
  }

  displayPlaceInSearch(placeId: string) {
    const geoPlace = this.places.find(place => place.id === placeId);
    return geoPlace ? geoPlace.displayName : '';
  }
}
