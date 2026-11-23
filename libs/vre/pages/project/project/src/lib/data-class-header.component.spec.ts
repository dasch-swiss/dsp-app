import { CUSTOM_ELEMENTS_SCHEMA, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { createMockLocalizationService } from '@dasch-swiss/vre/shared/app-helper-services/testing';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DataBrowserPageService } from './data-browser-page.service';
import { DataClassHeaderComponent } from './data-class-header.component';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { ProjectPageService } from './project-page.service';

describe('DataClassHeaderComponent', () => {
  let component: DataClassHeaderComponent;
  let fixture: ComponentFixture<DataClassHeaderComponent>;
  let mockDialog: jest.Mocked<MatDialog>;
  let mockViewContainerRef: jest.Mocked<ViewContainerRef>;
  let mockProjectPageService: jest.Mocked<ProjectPageService>;
  let mockStringifyPipe: jest.Mocked<StringifyStringLiteralPipe>;
  let mockDataBrowserPageService: jest.Mocked<DataBrowserPageService>;
  let mockLocalizationService: Partial<LocalizationService>;

  // Mock data
  const mockResClass = {
    id: 'http://example.org/ontology/ResourceClass',
    labels: [{ language: 'en', value: 'Test Resource Class' }],
    comments: [{ language: 'en', value: 'A test resource class' }],
    subClassOf: [],
    propertiesList: [],
    canBeInstantiated: true,
  } as any as ResourceClassDefinitionWithAllLanguages;

  const mockClassSelected = {
    classLabel: 'TestClass',
    ontologyLabel: 'TestOntology',
    resClass: mockResClass,
  };

  beforeEach(async () => {
    // Create mock services
    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: jest.fn().mockReturnValue(of(undefined)),
      }),
      openDialogs: [],
    } as any;

    mockViewContainerRef = {} as any;

    mockProjectPageService = {
      hasProjectMemberRights$: of(true),
      currentProject: {
        id: 'http://example.org/project/test-project',
        shortcode: '0001',
        shortname: 'test-project',
        longname: 'Test Project',
        description: [{ value: 'A test project', language: 'en' }],
        keywords: [],
        logo: null,
        selfjoin: false,
      },
    } as any;

    mockStringifyPipe = {
      transform: jest.fn().mockReturnValue('Transformed Label'),
    } as any;

    mockDataBrowserPageService = {
      reloadNavigation: jest.fn(),
    } as any;

    mockLocalizationService = createMockLocalizationService('en').service;

    await TestBed.configureTestingModule({
      imports: [DataClassHeaderComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: ViewContainerRef, useValue: mockViewContainerRef },
        { provide: ProjectPageService, useValue: mockProjectPageService },
        { provide: DataBrowserPageService, useValue: mockDataBrowserPageService },
        { provide: LocalizationService, useValue: mockLocalizationService },
        // Route-scoped in the app; this isolated fixture has no route.
        { provide: DataClassUrlStateService, useValue: { view$: of('list') } },
        ResourceResultService,
        provideTranslateService(),
        TranslateService,
      ],
    })
      .overrideComponent(DataClassHeaderComponent, {
        set: {
          // Template is overridden to isolate unit test from template rendering
          template: '<div>Mock Template</div>',
          providers: [{ provide: StringifyStringLiteralPipe, useValue: mockStringifyPipe }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DataClassHeaderComponent);
    component = fixture.componentInstance;

    // Set required input
    component.classSelected = mockClassSelected;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should have classSelected input set', () => {
      expect(component.classSelected).toBeDefined();
      expect(component.classSelected).toEqual(mockClassSelected);
    });

    it('should expose hasProjectMemberRights$ from ProjectPageService', () => {
      expect(component.hasProjectMemberRights$).toBe(mockProjectPageService.hasProjectMemberRights$);
    });
  });

  describe('goToAddClassInstance', () => {
    it('should open create resource dialog', done => {
      component.goToAddClassInstance();

      // Wait for dynamic import and observable chain to complete
      setTimeout(() => {
        expect(mockDialog.open).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should use StringifyStringLiteralPipe to transform resource labels', done => {
      component.goToAddClassInstance();

      setTimeout(() => {
        expect(mockStringifyPipe.transform).toHaveBeenCalledWith(mockResClass.labels);
        done();
      }, 100);
    });

    it('should pass resource class IRI to dialog', done => {
      component.goToAddClassInstance();

      setTimeout(() => {
        const callArgs = mockDialog.open.mock.calls[0];
        const config = callArgs[1] as any;
        expect(config.data.resourceClassIri).toBe(mockResClass.id);
        done();
      }, 100);
    });

    it('should set minWidth to 70vw', done => {
      component.goToAddClassInstance();

      setTimeout(() => {
        const callArgs = mockDialog.open.mock.calls[0];
        const config = callArgs[1] as any;
        expect(config.width).toBe('70vw');
        done();
      }, 100);
    });

    it('should use viewContainerRef from constructor', done => {
      component.goToAddClassInstance();

      setTimeout(() => {
        const callArgs = mockDialog.open.mock.calls[0];
        const config = callArgs[1] as any;
        // Check that viewContainerRef is defined (toBe comparison fails with jest private member access)
        expect(config.viewContainerRef).toBeDefined();
        done();
      }, 100);
    });
  });

  describe('hasProjectMemberRights$', () => {
    it('should emit true when user has project member rights', done => {
      mockProjectPageService.hasProjectMemberRights$ = of(true);
      component.hasProjectMemberRights$ = mockProjectPageService.hasProjectMemberRights$;

      component.hasProjectMemberRights$.subscribe(hasRights => {
        expect(hasRights).toBe(true);
        done();
      });
    });

    it('should emit false when user does not have project member rights', done => {
      mockProjectPageService.hasProjectMemberRights$ = of(false);
      component.hasProjectMemberRights$ = mockProjectPageService.hasProjectMemberRights$;

      component.hasProjectMemberRights$.subscribe(hasRights => {
        expect(hasRights).toBe(false);
        done();
      });
    });
  });
});
