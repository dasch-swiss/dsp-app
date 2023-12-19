import { Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  ApiData,
  PropertyData,
} from '../../data-access/advanced-search-service/advanced-search.service';
import {
  AdvancedSearchStoreService,
  PropertyFormItem,
} from '../../data-access/advanced-search-store/advanced-search-store.service';
import { AdvancedSearchComponent } from './advanced-search.component';

@Injectable()
export class MockAdvancedSearchStoreService {
  ontologies$: Observable<ApiData[]> = of([]);
  resourceClasses$ = new Observable<ApiData[]>();
  selectedProject$ = new Observable<string | undefined>();
  selectedOntology$ = new Observable<ApiData | undefined>();
  selectedResourceClass$ = new Observable<ApiData | undefined>();
  propertyFormList$ = new Observable<PropertyFormItem[]>();
  properties$ = new Observable<PropertyData[]>();
  filteredProperties$ = new Observable<PropertyData[]>();
  resourcesSearchResultsLoading$ = new Observable<boolean>();
  resourcesSearchResultsCount$ = new Observable<number>();
  resourcesSearchResultsPageNumber$ = new Observable<number>();
  resourcesSearchResults$ = new Observable<ApiData[]>();
  error?: any;

  setState(state: any): void {
    // Mocked implementation
  }

  ontologiesList(selectedProject: string | Observable<string>): void {
    // Mocked implementation
  }

  resourceClassesList(selectedOntology: string | Observable<string>): void {
    // Mocked implementation
  }

  propertiesList(selectedOntology: string | Observable<string>): void {
    // Mocked implementation
  }

  filteredPropertiesList(
    selectedResourceClass: string | Observable<string>
  ): void {
    // Mocked implementation
  }
}

describe('AdvancedSearchComponent', () => {
  let component: AdvancedSearchComponent;
  let fixture: ComponentFixture<AdvancedSearchComponent>;
  let mockAdvancedSearchStoreService: AdvancedSearchStoreService;
  let setStateSpy: jest.SpyInstance;
  let ontologiesListSpy: jest.SpyInstance;
  let resourceClassesListSpy: jest.SpyInstance;
  let propertiesListSpy: jest.SpyInstance;
  let filteredPropertiesListSpy: jest.SpyInstance;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdvancedSearchComponent,
        BrowserAnimationsModule,
        MatDialogModule,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              parent: {
                params: { uuid: '0123' },
              },
            },
          },
        },
        {
          provide: AdvancedSearchStoreService,
          useValue: {},
        },
      ],
    })
      .overrideComponent(AdvancedSearchComponent, {
        set: {
          providers: [
            {
              provide: AdvancedSearchStoreService,
              useClass: MockAdvancedSearchStoreService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdvancedSearchComponent);
    component = fixture.componentInstance;
    mockAdvancedSearchStoreService = fixture.debugElement.injector.get(
      AdvancedSearchStoreService
    );
    setStateSpy = jest.spyOn(mockAdvancedSearchStoreService, 'setState');
    ontologiesListSpy = jest.spyOn(
      mockAdvancedSearchStoreService,
      'ontologiesList'
    );
    resourceClassesListSpy = jest.spyOn(
      mockAdvancedSearchStoreService,
      'resourceClassesList'
    );
    propertiesListSpy = jest.spyOn(
      mockAdvancedSearchStoreService,
      'propertiesList'
    );
    filteredPropertiesListSpy = jest.spyOn(
      mockAdvancedSearchStoreService,
      'filteredPropertiesList'
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(setStateSpy).toHaveBeenCalled();
    expect(ontologiesListSpy).toHaveBeenCalled();
    expect(resourceClassesListSpy).toHaveBeenCalled();
    expect(propertiesListSpy).toHaveBeenCalled();
    expect(filteredPropertiesListSpy).toHaveBeenCalled();
  });
});
