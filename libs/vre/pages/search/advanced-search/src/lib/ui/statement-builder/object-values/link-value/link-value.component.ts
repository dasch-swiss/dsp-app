import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatAutocompleteOptionsScrollDirective } from '@dasch-swiss/vre/shared/app-common';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { IriLabelPair } from '../../../../model';
import { DynamicFormsDataService } from '../../../../service/dynamic-forms-data.service';

@Component({
  selector: 'app-link-value',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteModule,
    MatAutocompleteOptionsScrollDirective,
    MatProgressBar,
  ],
  template: `
    <mat-form-field class="width-100-percent" appearance="fill">
      <input
        matInput
        placeholder="Search for a resource"
        aria-label="Search for a resource by name"
        [matAutocomplete]="auto"
        [formControl]="inputControl"
        required />
      <mat-autocomplete
        #autoComplete
        #auto="matAutocomplete"
        [displayWith]="displayLabel"
        (optionsScroll)="onScroll()"
        (optionSelected)="onResourceSelected($event)">
        @let linkObjects = linkValueObjects$ | async;
        @let loading = loading$ | async;
        @let lastSearch = lastSearchString$ | async;

        @if (!linkObjects?.length && !loading) {
          @if (lastSearch && lastSearch.length >= this.MIN_SEARCH_LENGTH) {
            <mat-option [disabled]="true">No resources found for "{{ lastSearch }}"</mat-option>
          } @else {
            <mat-option [disabled]="true">Type at least 3 characters to search</mat-option>
          }
        }
        @if (linkObjects?.length && !loading) {
          <mat-option [disabled]="true">
            Showing {{ linkObjects.length }} results of {{ resultCount$ | async }}
          </mat-option>
        }
        @for (obj of linkObjects; track obj.iri ?? obj) {
          <mat-option [value]="obj">{{ obj?.label }}</mat-option>
        }
        @if (loading) {
          <mat-progress-bar mode="query" />
          <mat-option [disabled]="true">Loading resources...</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styleUrl: '../../../../advanced-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkValueComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private readonly OFFSET = 25;
  readonly MIN_SEARCH_LENGTH = 3;
  private _dataService = inject(DynamicFormsDataService);
  private destroy$ = new Subject<void>();

  @Input() resourceClass?: string;
  @Input() selectedResource?: IriLabelPair;

  @Output() emitResourceSelected = new EventEmitter<IriLabelPair>();

  linkValueObjects$ = new BehaviorSubject<IriLabelPair[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  lastSearchString$ = new BehaviorSubject<string | null>(null);
  resultCount$ = new BehaviorSubject<number>(0);

  inputControl = new FormControl<string | null>(null, [Validators.required, this.resourceSelectedValidator()]);

  private resourceSelectedValidator(): ValidatorFn {
    return (_control: AbstractControl): ValidationErrors | null => {
      // If control is empty, Validators.required will handle it
      // This validator checks if user typed text without selecting from autocomplete
      if (!_control.value) {
        return null;
      }
      // If there's text but no selectedResource, it means user didn't select from autocomplete
      return !this.selectedResource ? { resourceNotSelected: true } : null;
    };
  }

  ngOnInit() {
    this.inputControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(searchString =>
          this._dataService
            .getResourcesListCount$(searchString!, this.resourceClass!)
            .pipe(take(1))
            .subscribe(r => this.resultCount$.next(r))
        ),
        tap(searchString => this.lastSearchString$.next(searchString)),
        filter(searchString => searchString !== null && searchString.length >= this.MIN_SEARCH_LENGTH),
        tap(() => this.loading$.next(true)),
        switchMap(searchString => this._dataService.searchResourcesByLabel$(searchString!, this.resourceClass!, 0)),
        tap(() => this.loading$.next(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(results => {
        this.linkValueObjects$.next(results);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedResource'] && this.selectedResource) {
      this.inputControl.setValue(this.selectedResource.label, { emitEvent: false });
      this.inputControl.updateValueAndValidity();
    }
  }

  ngAfterViewInit(): void {
    if (this.selectedResource) {
      this.inputControl.setValue(this.selectedResource.label, { emitEvent: false });
    }
  }

  onResourceSelected(event: MatAutocompleteSelectedEvent) {
    const data = event.option.value as IriLabelPair;
    this.inputControl.setValue(data.label, { emitEvent: false });
    this.emitResourceSelected.emit(data);
  }

  onScroll() {
    if (this.loading$.value) {
      return;
    }
    const lastSearch = this.lastSearchString$.value;
    const currentResults = this.linkValueObjects$.value;

    if (
      !lastSearch ||
      lastSearch.length < this.MIN_SEARCH_LENGTH ||
      currentResults.length < this.OFFSET ||
      currentResults.length >= this.resultCount$.value
    ) {
      return;
    }

    this.loading$.next(true);
    const offset = Math.ceil(currentResults.length / this.OFFSET) - 1;

    this._dataService
      .searchResourcesByLabel$(lastSearch, this.resourceClass!, offset)
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        finalize(() => this.loading$.next(false))
      )
      .subscribe(results => {
        this.linkValueObjects$.next([...currentResults, ...results]);
      });
  }

  displayLabel = (value: string | null): string => value ?? '';

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loading$.complete();
    this.linkValueObjects$.complete();
    this.lastSearchString$.complete();
  }
}
