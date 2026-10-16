import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { RESOURCE_DESCRIPTION_ENABLED } from '@dasch-swiss/vre/core/config';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { ProjectShortnameService } from '../project-shortname.service';
import { ResourceListItemComponent } from './resource-list-item.component';

const RESOURCE_LABEL_KEY = 'pages.dataBrowser.resourceListItem.resourceLabel';

/** The translation keys of the "Found in:" entries that stand for the resource's own label. */
const foundInKeys = (component: ResourceListItemComponent) =>
  component.foundIn.flatMap(entry => (entry.translationKey ? [entry.translationKey] : []));

/** The first (single-language) value of each property entry in the "Found in:" list. */
const foundInLabelValues = (component: ResourceListItemComponent) =>
  component.foundIn.flatMap(entry => (entry.labels ? [entry.labels[0]?.value] : []));

describe('ResourceListItemComponent', () => {
  let component: ResourceListItemComponent;
  let fixture: ComponentFixture<ResourceListItemComponent>;
  let mockMultipleViewerService: jest.Mocked<MultipleViewerService>;
  let mockProjectShortnameService: jest.Mocked<ProjectShortnameService>;
  let selectedResourcesSubject: BehaviorSubject<ReadResource[]>;

  let mockResource: ReadResource;
  let mockResource2: ReadResource;
  let resourceDescriptionEnabled = false;

  beforeEach(async () => {
    selectedResourcesSubject = new BehaviorSubject<ReadResource[]>([]);

    mockResource = {
      id: 'http://example.org/resource-1',
      label: 'Test Resource Label',
      attachedToProject: 'http://example.org/project-1',
      properties: {
        'http://example.org/property-1': [
          {
            strval: 'Test property value',
            propertyLabel: 'Test Property',
          } as any,
        ],
        'http://example.org/property-2': [
          {
            strval: 'Another value',
            propertyLabel: 'Another Property',
          } as any,
        ],
      },
    } as unknown as ReadResource;

    mockResource2 = {
      id: 'http://example.org/resource-2',
      label: 'Second Resource',
      attachedToProject: 'http://example.org/project-2',
      properties: {},
    } as unknown as ReadResource;

    mockMultipleViewerService = {
      selectedResources$: selectedResourcesSubject.asObservable(),
      selectMode: false,
      searchKeyword: undefined,
      selectOneResource: jest.fn(),
      addResources: jest.fn(),
      removeResources: jest.fn(),
    } as any;

    mockProjectShortnameService = {
      getProjectShortname: jest.fn().mockReturnValue(of('TEST-SHORTNAME')),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ResourceListItemComponent, TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MultipleViewerService, useValue: mockMultipleViewerService },
        { provide: ProjectShortnameService, useValue: mockProjectShortnameService },
        { provide: RESOURCE_DESCRIPTION_ENABLED, useFactory: () => resourceDescriptionEnabled },
      ],
    })
      .overrideComponent(ResourceListItemComponent, {
        set: {
          // Template is overridden to isolate unit test from template rendering
          // This tests only the component logic, not UI integration
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceListItemComponent);
    component = fixture.componentInstance;
    component.resource = mockResource;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should initialize with empty foundIn array and showCheckbox false', () => {
      expect(component.showCheckbox).toBe(false);
      expect(component.foundIn).toEqual([]);
    });

    it('should require resource input', () => {
      expect(component.resource).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should not search when searchKeyword is undefined', () => {
      mockMultipleViewerService.searchKeyword = undefined;

      component.ngOnInit();

      expect(component.foundIn).toEqual([]);
    });

    it('should search in resource label when searchKeyword matches', () => {
      mockMultipleViewerService.searchKeyword = 'test resource';

      component.ngOnInit();

      expect(foundInKeys(component)).toContain(RESOURCE_LABEL_KEY);
    });

    it('should search in resource properties when searchKeyword matches', () => {
      mockMultipleViewerService.searchKeyword = 'property value';

      component.ngOnInit();

      expect(foundInLabelValues(component)).toContain('Test Property');
    });

    it('should find matches in both label and properties', () => {
      mockMultipleViewerService.searchKeyword = 'test';

      component.ngOnInit();

      expect(foundInKeys(component)).toContain(RESOURCE_LABEL_KEY);
      expect(foundInLabelValues(component)).toContain('Test Property');
    });

    it('should be case-insensitive when searching', () => {
      mockMultipleViewerService.searchKeyword = 'ANOTHER VALUE';

      component.ngOnInit();

      expect(foundInLabelValues(component)).toContain('Another Property');
    });

    it('should not add duplicate property labels to foundIn', () => {
      const resourceWithDuplicates = {
        ...mockResource,
        properties: {
          'http://example.org/property-1': [
            { strval: 'match text', propertyLabel: 'Same Property' } as any,
            { strval: 'match again', propertyLabel: 'Same Property' } as any,
          ],
        },
      } as unknown as ReadResource;
      component.resource = resourceWithDuplicates;
      mockMultipleViewerService.searchKeyword = 'match';

      component.ngOnInit();

      const samePropertyCount = foundInLabelValues(component).filter(label => label === 'Same Property').length;
      expect(samePropertyCount).toBe(1);
    });

    it('should ignore properties without strval', () => {
      const resourceWithEmptyStrval = {
        ...mockResource,
        properties: {
          'http://example.org/property-1': [{ strval: undefined, propertyLabel: 'Empty Property' } as any],
        },
      } as unknown as ReadResource;
      component.resource = resourceWithEmptyStrval;
      mockMultipleViewerService.searchKeyword = 'anything';

      component.ngOnInit();

      expect(foundInLabelValues(component)).not.toContain('Empty Property');
    });

    // The single-language `propertyLabel` is what dsp-api resolved server-side; the "Found in:"
    // names must follow the UI language like the resource class does (DEV-5452 follow-up).
    it('should prefer the multi-language property labels from entityInfo', () => {
      component.resource = {
        ...mockResource,
        properties: {
          'http://example.org/property-1': [{ strval: 'match text', propertyLabel: 'Realization' } as any],
        },
        entityInfo: {
          classes: {},
          properties: {
            'http://example.org/property-1': {
              labels: [
                { language: 'en', value: 'Realization' },
                { language: 'fr', value: 'Réalisation' },
              ],
            },
          },
        },
      } as unknown as ReadResource;
      mockMultipleViewerService.searchKeyword = 'match';

      component.ngOnInit();

      expect(component.foundIn).toEqual([
        {
          labels: [
            { language: 'en', value: 'Realization' },
            { language: 'fr', value: 'Réalisation' },
          ],
        },
      ]);
    });
  });

  describe('resourceClassLabels', () => {
    it('should prefer the multi-language labels from entityInfo', () => {
      component.resource = {
        ...mockResource,
        type: 'http://example.org/onto/v2#Letter',
        resourceClassLabel: 'Stale label',
        entityInfo: {
          classes: {
            'http://example.org/onto/v2#Letter': { labels: [{ language: 'en', value: 'Letter' }] },
          },
        },
      } as unknown as ReadResource;

      component.ngOnInit();

      expect(component.resourceClassLabels).toEqual([{ language: 'en', value: 'Letter' }]);
    });

    it('should fall back to resourceClassLabel when entityInfo has no labels for the type', () => {
      component.resource = {
        ...mockResource,
        type: 'http://example.org/onto/v2#Letter',
        resourceClassLabel: 'Letter',
        entityInfo: { classes: {} },
      } as unknown as ReadResource;

      component.ngOnInit();

      expect(component.resourceClassLabels).toEqual([{ value: 'Letter' }]);
    });

    it('should be null when neither source has a label', () => {
      component.resource = mockResource;

      component.ngOnInit();

      expect(component.resourceClassLabels).toBeNull();
    });

    it('should keep the same array reference across reads, so the impure label pipe can memoize', () => {
      component.resource = {
        ...mockResource,
        type: 'http://example.org/onto/v2#Letter',
        entityInfo: {
          classes: {
            'http://example.org/onto/v2#Letter': { labels: [{ language: 'en', value: 'Letter' }] },
          },
        },
      } as unknown as ReadResource;

      component.ngOnInit();

      expect(component.visibleResourceClassLabels).toBe(component.visibleResourceClassLabels);
    });
  });

  describe('visibleResourceClassLabels', () => {
    const resourceWithClass = (base: ReadResource) =>
      ({
        ...base,
        type: 'http://example.org/onto/v2#Letter',
        entityInfo: {
          classes: {
            'http://example.org/onto/v2#Letter': { labels: [{ language: 'en', value: 'Letter' }] },
          },
        },
      }) as unknown as ReadResource;

    it('should expose the labels when the class is shown', () => {
      component.resource = resourceWithClass(mockResource);
      component.showResourceClass = true;

      component.ngOnInit();

      expect(component.visibleResourceClassLabels).toEqual([{ language: 'en', value: 'Letter' }]);
    });

    it('should be null when the class is not shown, even though labels exist', () => {
      component.resource = resourceWithClass(mockResource);
      component.showResourceClass = false;

      component.ngOnInit();

      expect(component.visibleResourceClassLabels).toBeNull();
    });

    // Without this, the row rendered an empty metadata line (and a dangling "|" before "Found in:")
    // for resources whose class label could not be resolved.
    it('should be null when the class is shown but no label could be resolved', () => {
      component.resource = mockResource;
      component.showResourceClass = true;

      component.ngOnInit();

      expect(component.visibleResourceClassLabels).toBeNull();
    });
  });

  describe('isHighlighted$', () => {
    it('should highlight resource when it is the only selected resource (not in selectMode)', done => {
      mockMultipleViewerService.selectMode = false;
      selectedResourcesSubject.next([mockResource]);

      component.isHighlighted$.subscribe(highlighted => {
        expect(highlighted).toBe(true);
        done();
      });
    });

    it('should not highlight when different resource is selected (not in selectMode)', done => {
      mockMultipleViewerService.selectMode = false;
      selectedResourcesSubject.next([mockResource2]);

      component.isHighlighted$.subscribe(highlighted => {
        expect(highlighted).toBe(false);
        done();
      });
    });

    it('should highlight when resource is in selected list (in selectMode)', done => {
      mockMultipleViewerService.selectMode = true;
      selectedResourcesSubject.next([mockResource, mockResource2]);

      component.isHighlighted$.subscribe(highlighted => {
        expect(highlighted).toBe(true);
        done();
      });
    });

    it('should not highlight when resource is not in selected list (in selectMode)', done => {
      mockMultipleViewerService.selectMode = true;
      selectedResourcesSubject.next([mockResource2]);

      component.isHighlighted$.subscribe(highlighted => {
        expect(highlighted).toBe(false);
        done();
      });
    });

    it('should not highlight when no resources are selected', done => {
      mockMultipleViewerService.selectMode = false;
      selectedResourcesSubject.next([]);

      component.isHighlighted$.subscribe(highlighted => {
        expect(highlighted).toBe(false);
        done();
      });
    });
  });

  describe('isSelected$', () => {
    it('should return true when resource is selected and in selectMode', done => {
      mockMultipleViewerService.selectMode = true;
      selectedResourcesSubject.next([mockResource]);

      component.isSelected$.subscribe(selected => {
        expect(selected).toBe(true);
        done();
      });
    });

    it('should return false when resource is selected but not in selectMode', done => {
      mockMultipleViewerService.selectMode = false;
      selectedResourcesSubject.next([mockResource]);

      component.isSelected$.subscribe(selected => {
        expect(selected).toBe(false);
        done();
      });
    });

    it('should return false when resource is not selected even in selectMode', done => {
      mockMultipleViewerService.selectMode = true;
      selectedResourcesSubject.next([mockResource2]);

      component.isSelected$.subscribe(selected => {
        expect(selected).toBe(false);
        done();
      });
    });

    it('should return false when selectMode is false and resource not selected', done => {
      mockMultipleViewerService.selectMode = false;
      selectedResourcesSubject.next([]);

      component.isSelected$.subscribe(selected => {
        expect(selected).toBe(false);
        done();
      });
    });
  });

  describe('onCheckboxChanged', () => {
    it('should add resource when checkbox is checked', () => {
      const event = { checked: true } as MatCheckboxChange;

      component.onCheckboxChanged(event);

      expect(mockMultipleViewerService.addResources).toHaveBeenCalledWith([mockResource]);
      expect(mockMultipleViewerService.removeResources).not.toHaveBeenCalled();
    });

    it('should remove resource when checkbox is unchecked', () => {
      const event = { checked: false } as MatCheckboxChange;

      component.onCheckboxChanged(event);

      expect(mockMultipleViewerService.removeResources).toHaveBeenCalledWith([mockResource]);
      expect(mockMultipleViewerService.addResources).not.toHaveBeenCalled();
    });
  });

  describe('Observable updates', () => {
    it('should reactively update highlight state when selected resources change', done => {
      const emittedValues: boolean[] = [];
      let emissionCount = 0;

      mockMultipleViewerService.selectMode = false;

      component.isHighlighted$.subscribe(highlighted => {
        emittedValues.push(highlighted);
        emissionCount++;

        // After 3 emissions, verify the sequence
        if (emissionCount === 3) {
          // 1st emission: initial BehaviorSubject value (empty array) = false
          // 2nd emission: mockResource selected = true
          // 3rd emission: mockResource2 selected (different resource) = false
          expect(emittedValues).toEqual([false, true, false]);
          done();
        }
      });

      // Trigger emissions by changing selected resources
      selectedResourcesSubject.next([mockResource]); // Should emit true
      selectedResourcesSubject.next([mockResource2]); // Should emit false
    });
  });
  describe('description', () => {
    const withDescription = (xml: string) =>
      ({ ...mockResource, properties: { [Constants.HasDescription]: [{ strval: xml }] } }) as unknown as ReadResource;

    it('is not shown while the feature flag is off', () => {
      component.resource = withDescription('<text><p>Hidden</p></text>');
      component.ngOnInit();
      expect(component.description).toBeNull();
    });

    describe('with the feature flag on', () => {
      // beforeAll runs before the outer beforeEach creates the component.
      beforeAll(() => (resourceDescriptionEnabled = true));
      afterAll(() => (resourceDescriptionEnabled = false));

      it('is the first description as plain text', () => {
        component.resource = withDescription(
          '<?xml version="1.0" encoding="UTF-8"?>\n<text><p>A <em>fine</em> one</p></text>'
        );
        component.ngOnInit();
        expect(component.description).toBe('A fine one');
      });

      it('is null when the resource has no description', () => {
        component.ngOnInit();
        expect(component.description).toBeNull();
      });

      it('is null when the description is only markup', () => {
        component.resource = withDescription('<text><p></p></text>');
        component.ngOnInit();
        expect(component.description).toBeNull();
      });
    });
  });
});

/**
 * Rendered against the real template — the suite above overrides it away. The "Found in:" names are
 * resolved by the impure `appStringifyStringLiteral` / `translate` pipes, so nothing but the DOM
 * proves that they follow the UI language, and nothing but the DOM catches a stray space around the
 * separator that the template's control-flow blocks can introduce.
 */
describe('ResourceListItemComponent rendering', () => {
  const propertyLabels = (language: string, value: string) => [{ language, value }];

  const renderWithFoundIn = async (searchKeyword: string, resource: ReadResource, language = 'en') => {
    await TestBed.configureTestingModule({
      imports: [ResourceListItemComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: MultipleViewerService,
          useValue: {
            selectedResources$: of([]),
            selectMode: false,
            searchKeyword,
            selectOneResource: jest.fn(),
          },
        },
        { provide: ProjectShortnameService, useValue: { getProjectShortname: () => of('testproj') } },
        { provide: RESOURCE_DESCRIPTION_ENABLED, useValue: false },
      ],
    }).compileComponents();

    TestBed.inject(LocalizationService).currentLanguage = language as never;

    const fixture = TestBed.createComponent(ResourceListItemComponent);
    fixture.componentInstance.resource = resource;
    fixture.detectChanges();
    return fixture;
  };

  const foundInText = (fixture: ComponentFixture<ResourceListItemComponent>) =>
    fixture.nativeElement.querySelector('[data-cy="found-in-values"]').textContent.trim();

  const twoMatchingProperties = {
    id: 'http://example.org/resource-1',
    label: 'Untouched',
    attachedToProject: 'http://example.org/project-1',
    properties: {
      'http://example.org/property-1': [{ strval: 'match one', propertyLabel: 'Realization' } as any],
      'http://example.org/property-2': [{ strval: 'match two', propertyLabel: 'Title' } as any],
    },
    entityInfo: {
      classes: {},
      properties: {
        'http://example.org/property-1': { labels: propertyLabels('fr', 'Réalisation') },
        'http://example.org/property-2': { labels: propertyLabels('fr', 'Titre') },
      },
    },
  } as unknown as ReadResource;

  it('should join the names with ", " and no stray space before the separator', async () => {
    const fixture = await renderWithFoundIn('match', twoMatchingProperties, 'fr');

    expect(foundInText(fixture)).toBe('Réalisation, Titre');
  });

  it('should re-render the names when the UI language changes', async () => {
    const resource = {
      ...twoMatchingProperties,
      properties: {
        'http://example.org/property-1': [{ strval: 'match one', propertyLabel: 'Realization' } as any],
      },
      entityInfo: {
        classes: {},
        properties: {
          'http://example.org/property-1': {
            labels: [
              { language: 'en', value: 'Realization' },
              { language: 'fr', value: 'Réalisation' },
            ],
          },
        },
      },
    } as unknown as ReadResource;

    const fixture = await renderWithFoundIn('match', resource);
    const localization = TestBed.inject(LocalizationService);

    localization.currentLanguage = 'en';
    fixture.detectChanges();
    expect(foundInText(fixture)).toBe('Realization');

    localization.currentLanguage = 'fr';
    fixture.detectChanges();
    expect(foundInText(fixture)).toBe('Réalisation');
  });

  it('should render the resource-label entry through a translation key, not a hardcoded string', async () => {
    const fixture = await renderWithFoundIn('untouched', {
      ...twoMatchingProperties,
      properties: {},
      entityInfo: { classes: {}, properties: {} },
    } as unknown as ReadResource);

    // No translations are loaded, so ngx-translate echoes the key — which is exactly what proves the
    // entry goes through it instead of the previous hardcoded 'Label'.
    expect(foundInText(fixture)).toBe(RESOURCE_LABEL_KEY);
  });
});
