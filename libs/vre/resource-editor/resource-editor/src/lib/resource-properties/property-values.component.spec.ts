import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cardinality, ReadResource, ReadValue, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { PropertyValueService } from './property-value.service';
import { PropertyValuesComponent } from './property-values.component';

describe('PropertyValuesComponent', () => {
  let component: PropertyValuesComponent;
  let fixture: ComponentFixture<PropertyValuesComponent>;
  let mockPropertyValueService: jest.Mocked<Partial<PropertyValueService>>;
  let mockResourceFetcherService: jest.Mocked<Partial<ResourceFetcherService>>;

  const mockValues = [
    {
      id: 'http://rdfh.ch/0001/value-1',
      type: 'text',
      userHasPermission: 'M',
      strval: 'Alpha',
    } as unknown as ReadValue,
    { id: 'http://rdfh.ch/0001/value-2', type: 'text', userHasPermission: 'M', strval: 'Beta' } as unknown as ReadValue,
    {
      id: 'http://rdfh.ch/0001/value-3',
      type: 'text',
      userHasPermission: 'M',
      strval: 'Gamma',
    } as unknown as ReadValue,
  ];

  const mockResource = {
    id: 'http://rdfh.ch/0001/resource-1',
    type: 'anything:Thing',
    userHasPermission: 'M',
  } as unknown as ReadResource;

  const mockPropDef = {
    id: 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
  } as ResourcePropertyDefinition;

  const mockMyProperty = {
    propDef: mockPropDef,
    guiDef: { cardinality: Cardinality._0_n },
    values: mockValues,
  } as unknown as PropertyInfoValues;

  beforeEach(async () => {
    mockPropertyValueService = {
      editModeData: { resource: mockResource, values: mockValues },
      propertyDefinition: mockPropDef,
      cardinality: Cardinality._0_n,
      lastOpenedItem$: new BehaviorSubject<number | null>(null),
    } as any;

    mockResourceFetcherService = {
      resourceVersion: undefined,
      reload: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PropertyValuesComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: PropertyValueService, useValue: mockPropertyValueService },
        { provide: ResourceFetcherService, useValue: mockResourceFetcherService },
        provideTranslateService(),
      ],
    })
      .overrideComponent(PropertyValuesComponent, {
        set: {
          template: '<div>Mock Template</div>',
          providers: [{ provide: PropertyValueService, useValue: mockPropertyValueService }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PropertyValuesComponent);
    component = fixture.componentInstance;
    component.editModeData = { resource: mockResource, values: [...mockValues] };
    component.myProperty = mockMyProperty;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('canReorder', () => {
    it('should return true when user has modify permission and not viewing old version', () => {
      expect(component.canReorder).toBe(true);
    });

    it('should return false when viewing historical resource version', () => {
      mockResourceFetcherService.resourceVersion = '20230101T000000Z';
      expect(component.canReorder).toBe(false);
    });
  });

  describe('isAnyValueEditing', () => {
    it('should return false when no value is being edited', () => {
      expect(component.isAnyValueEditing).toBe(false);
    });

    it('should return true when a value is being edited', () => {
      mockPropertyValueService.lastOpenedItem$!.next(1);
      expect(component.isAnyValueEditing).toBe(true);
    });
  });

  describe('dragDropDisabled', () => {
    it('should be false when user can reorder and no editing/adding is active', () => {
      expect(component.dragDropDisabled).toBe(false);
    });

    it('should be true when user cannot reorder (historical version)', () => {
      mockResourceFetcherService.resourceVersion = '20230101T000000Z';
      expect(component.dragDropDisabled).toBe(true);
    });

    it('should be true when a value is being edited', () => {
      mockPropertyValueService.lastOpenedItem$!.next(1);
      expect(component.dragDropDisabled).toBe(true);
    });

    it('should be true when currently adding a value', () => {
      component.currentlyAdding = true;
      expect(component.dragDropDisabled).toBe(true);
    });
  });
});
