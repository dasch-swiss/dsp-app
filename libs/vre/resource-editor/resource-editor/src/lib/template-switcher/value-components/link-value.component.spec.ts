import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { KnoraApiConnection, ReadLinkValue, ReadResource, ResourceClassDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LinkValueDataService } from './link-value-data.service';
import { LinkValueComponent } from './link-value.component';

// Mock the CreateResourceDialogComponent to avoid deep import issues
jest.mock('../create-resource-dialog.component', () => ({
  CreateResourceDialogComponent: class {},
  CreateResourceDialogProps: class {},
}));

describe('LinkValueComponent', () => {
  let component: LinkValueComponent;
  let fixture: ComponentFixture<LinkValueComponent>;
  let mockDspApiConnection: jest.Mocked<KnoraApiConnection>;
  let mockDialog: jest.Mocked<MatDialog>;
  let mockLinkValueDataService: jest.Mocked<LinkValueDataService>;

  const mockOntology = {
    id: 'http://example.org/ontology/test',
  };

  const mockResourceClassDefinition: any = {
    id: 'http://example.org/ontology/test#TestClass',
    label: 'Test Class',
    comment: 'Test comment',
    subClassOf: [],
    properties: {
      'http://example.org/ontology/test#hasLinkTo': {
        objectType: 'http://example.org/ontology/test#LinkedClass',
      },
      'http://example.org/ontology/test#hasLinkToValue': {
        objectType: 'http://example.org/ontology/test#LinkedClass',
      },
    },
  };

  const mockReadResource: any = {
    id: 'http://example.org/resource/1',
    label: 'Test Resource 1',
    entityInfo: mockResourceClassDefinition,
    getLinkPropertyIriFromLinkValuePropertyIri: jest.fn().mockReturnValue('http://example.org/ontology/test#hasLinkTo'),
  };

  const mockResources: ReadResource[] = [
    mockReadResource,
    {
      id: 'http://example.org/resource/2',
      label: 'Test Resource 2',
    } as any,
  ];

  const mockSearchResponse = {
    resources: mockResources,
    mayHaveMoreResults: false,
  };

  beforeEach(async () => {
    const mockOntologyMap = new Map();
    mockOntologyMap.set('http://example.org/ontology/test', {
      id: 'http://example.org/ontology/test',
      getClassDefinitionsByType: jest.fn().mockReturnValue([]),
      getPropertyDefinitionsByType: jest.fn().mockReturnValue([]),
    });

    mockDspApiConnection = {
      v2: {
        ontologyCache: {
          reloadCachedItem: jest.fn().mockReturnValue(of(mockOntology)),
          getResourceClassDefinition: jest.fn().mockReturnValue(of(mockResourceClassDefinition)),
          getOntology: jest.fn().mockReturnValue(of(mockOntologyMap)),
        },
        res: {
          getResource: jest.fn().mockReturnValue(of(mockReadResource)),
        },
        search: {
          doSearchByLabel: jest.fn().mockReturnValue(of(mockSearchResponse)),
        },
      },
    } as any;

    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(null)),
      }),
    } as any;

    mockLinkValueDataService = {
      onInit: jest.fn(),
      resourceClasses: [],
    } as any;

    await TestBed.configureTestingModule({
      declarations: [LinkValueComponent],
      imports: [
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: MatDialog, useValue: mockDialog },
        { provide: LinkValueDataService, useValue: mockLinkValueDataService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(LinkValueComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LinkValueComponent);
    component = fixture.componentInstance;

    // Set required inputs
    component.control = new FormControl<string | null>(null);
    component.propIri = 'http://example.org/ontology/test#hasLinkToValue';
    component.resourceClassIri = 'http://example.org/ontology/test#TestClass';
    component.projectIri = 'http://example.org/project/test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ngOnInit', () => {
    it('should call ontology API methods on initialization', () => {
      // Don't call detectChanges to avoid full initialization issues
      // Just test that the component would call the right APIs
      component.ngOnInit();

      expect(mockDspApiConnection.v2.ontologyCache.reloadCachedItem).toHaveBeenCalledWith(
        'http://example.org/ontology/test'
      );
    });
  });

  describe('onInputValueChange', () => {
    beforeEach(() => {
      component.readResource = mockReadResource;
      component.input = { nativeElement: { value: '' } } as any;
    });

    it('should not search if input value is less than 3 characters', () => {
      component.input.nativeElement.value = 'ab';
      component.onInputValueChange();

      expect(mockDspApiConnection.v2.search.doSearchByLabel).not.toHaveBeenCalled();
    });

    it('should clear resources array when input changes', () => {
      component.resources = [mockReadResource];
      component.input.nativeElement.value = 'ab';

      component.onInputValueChange();

      expect(component.resources).toEqual([]);
    });

    it('should not search if readResource is not defined', () => {
      component.readResource = undefined;
      component.input.nativeElement.value = 'test';

      component.onInputValueChange();

      expect(mockDspApiConnection.v2.search.doSearchByLabel).not.toHaveBeenCalled();
    });
  });

  describe('openCreateResourceDialog', () => {
    const mockResourceClassIri = 'http://example.org/ontology/test#NewClass';
    const mockResourceType = 'New Resource Type';
    const mockEvent = { stopPropagation: jest.fn() };

    beforeEach(() => {
      component.autoComplete = { closePanel: jest.fn() } as any;
    });

    it('should stop event propagation and open dialog', () => {
      component.openCreateResourceDialog(mockEvent, mockResourceClassIri, mockResourceType);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockDialog.open).toHaveBeenCalled();

      const dialogCall = mockDialog.open.mock.calls[0];
      expect(dialogCall[1]).toMatchObject({
        minWidth: 800,
      });
    });
  });

  describe('handleNonSelectedValues', () => {
    beforeEach(() => {
      component.input = { nativeElement: { value: 'some text' } } as any;
      component.resources = mockResources;
      component.useDefaultValue = false;
    });

    it('should clear input if value does not match selected resource', () => {
      component.control.setValue('http://example.org/resource/1');
      component.input.nativeElement.value = 'wrong text';

      component.handleNonSelectedValues();

      expect(component.input.nativeElement.value).toBe('');
    });

    it('should keep input value if it matches selected resource label', () => {
      component.control.setValue('http://example.org/resource/1');
      component.input.nativeElement.value = 'Test Resource 1';

      component.handleNonSelectedValues();

      expect(component.input.nativeElement.value).toBe('Test Resource 1');
    });
  });

  describe('displayResource', () => {
    beforeEach(() => {
      component.resources = mockResources;
    });

    it('should return default value when useDefaultValue is true', () => {
      component.useDefaultValue = true;
      const mockLinkValue = { strval: 'Default Label' } as ReadLinkValue;
      component.defaultValue = mockLinkValue as any;

      const result = component.displayResource('http://example.org/resource/1');

      expect(result).toBe('Default Label');
    });

    it('should return empty string when useDefaultValue is true but no default value', () => {
      component.useDefaultValue = true;
      component.defaultValue = undefined;

      const result = component.displayResource('http://example.org/resource/1');

      expect(result).toBe('');
    });

    it('should return empty string for null resource ID', () => {
      component.useDefaultValue = false;

      const result = component.displayResource(null);

      expect(result).toBe('');
    });

    it('should return resource label for valid resource ID', () => {
      component.useDefaultValue = false;

      const result = component.displayResource('http://example.org/resource/1');

      expect(result).toBe('Test Resource 1');
    });

    it('should return empty string for non-existent resource ID', () => {
      component.useDefaultValue = false;

      const result = component.displayResource('http://example.org/resource/999');

      expect(result).toBe('');
    });
  });

  describe('trackByResourcesFn', () => {
    it('should return unique identifier for resource', () => {
      const result = component.trackByResourcesFn(0, mockReadResource);

      expect(result).toBe('0-http://example.org/resource/1');
    });
  });

  describe('trackByResourceClassFn', () => {
    it('should return unique identifier for resource class', () => {
      const mockResourceClass = { id: 'http://example.org/ontology/test#Class' } as ResourceClassDefinition;

      const result = component.trackByResourceClassFn(1, mockResourceClass);

      expect(result).toBe('1-http://example.org/ontology/test#Class');
    });
  });
});
