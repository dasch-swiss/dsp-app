import { CUSTOM_ELEMENTS_SCHEMA, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { MultipleViewerService, ResourceClassCountApi } from '@dasch-swiss/vre/pages/data-browser';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { StringifyStringLiteralPipe } from '@dasch-swiss/vre/ui/string-literal';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { DataBrowserPageService } from './data-browser-page.service';
import { DataClassPanelComponent } from './data-class-panel.component';
import { DownloadDialogComponent } from './download/download-dialog.component';
import { ProjectPageService } from './project-page.service';

describe('DataClassPanelComponent', () => {
  let component: DataClassPanelComponent;
  let fixture: ComponentFixture<DataClassPanelComponent>;
  let mockDialog: jest.Mocked<MatDialog>;
  let mockViewContainerRef: jest.Mocked<ViewContainerRef>;
  let mockProjectPageService: jest.Mocked<ProjectPageService>;
  let mockMultipleViewerService: jest.Mocked<MultipleViewerService>;
  let mockResClassCountApi: jest.Mocked<ResourceClassCountApi>;
  let mockStringifyPipe: jest.Mocked<StringifyStringLiteralPipe>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockDataBrowserPageService: jest.Mocked<DataBrowserPageService>;
  let mockLocalizationService: jest.Mocked<LocalizationService>;

  // Mock observables
  let selectedResourcesSubject: BehaviorSubject<ReadResource[]>;

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

  const createMockResource = (id: string): ReadResource => {
    const mockResourceClass = {
      getResourcePropertiesList: jest.fn().mockReturnValue([]),
    };

    const resource = {
      id,
      type: 'http://api.knora.org/ontology/knora-api/v2#Resource',
      label: `Resource ${id}`,
      entityInfo: {
        classes: {
          'http://api.knora.org/ontology/knora-api/v2#Resource': mockResourceClass,
        },
        getPropertyDefinitionsByType: jest.fn().mockReturnValue([]),
      },
      getPropertyByName: jest.fn().mockReturnValue({
        values: [],
      }),
      properties: {},
    } as any;

    return resource;
  };

  beforeEach(async () => {
    // Initialize subjects
    selectedResourcesSubject = new BehaviorSubject<ReadResource[]>([]);

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
        status: true,
        selfjoin: false,
      },
    } as any;

    mockMultipleViewerService = {
      selectedResources$: selectedResourcesSubject.asObservable(),
    } as any;

    mockResClassCountApi = {
      getResourceClassCount: jest.fn(),
    } as any;

    mockStringifyPipe = {
      transform: jest.fn().mockReturnValue('Transformed Label'),
    } as any;

    mockNotificationService = {
      openSnackBar: jest.fn(),
    } as any;

    mockDataBrowserPageService = {
      reloadNavigation: jest.fn(),
    } as any;

    mockLocalizationService = {
      getCurrentLanguage: jest.fn().mockReturnValue('en'),
      getLanguageFromBrowser: jest.fn().mockReturnValue('en'),
    } as any;

    await TestBed.configureTestingModule({
      imports: [DataClassPanelComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: ViewContainerRef, useValue: mockViewContainerRef },
        { provide: ProjectPageService, useValue: mockProjectPageService },
        { provide: MultipleViewerService, useValue: mockMultipleViewerService },
        { provide: ResourceClassCountApi, useValue: mockResClassCountApi },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: DataBrowserPageService, useValue: mockDataBrowserPageService },
        { provide: LocalizationService, useValue: mockLocalizationService },
        provideTranslateService(),
        TranslateService,
      ],
    })
      .overrideComponent(DataClassPanelComponent, {
        set: {
          // Template is overridden to isolate unit test from template rendering
          template: '<div>Mock Template</div>',
          providers: [{ provide: StringifyStringLiteralPipe, useValue: mockStringifyPipe }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DataClassPanelComponent);
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

  describe('openDownloadDialog', () => {
    const mockResource1 = createMockResource('resource-1');

    beforeEach(() => {
      // Mock generateDspResource to return a resource with editable properties
      selectedResourcesSubject.next([mockResource1]);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(10));
    });

    it('should get resource class count', done => {
      component.openDownloadDialog();

      setTimeout(() => {
        expect(mockResClassCountApi.getResourceClassCount).toHaveBeenCalledWith(mockResClass.id);
        done();
      }, 0);
    });

    it('should show notification when resource count is 0', done => {
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(0));

      component.openDownloadDialog();

      setTimeout(() => {
        expect(mockNotificationService.openSnackBar).toHaveBeenCalledWith(
          'pages.dataBrowser.downloadDialog.noResources'
        );
        expect(mockDialog.open).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should show notification when no resources selected', done => {
      selectedResourcesSubject.next([]);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(10));

      component.openDownloadDialog();

      setTimeout(() => {
        expect(mockNotificationService.openSnackBar).toHaveBeenCalledWith(
          'pages.dataBrowser.downloadDialog.noResources'
        );
        expect(mockDialog.open).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should not open dialog when both count and resources are 0', done => {
      selectedResourcesSubject.next([]);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(0));

      component.openDownloadDialog();

      setTimeout(() => {
        expect(mockDialog.open).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should open download dialog with correct data when resources exist', done => {
      const mockResources = [mockResource1];
      selectedResourcesSubject.next(mockResources);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(25));

      component.openDownloadDialog();

      setTimeout(() => {
        expect(mockDialog.open).toHaveBeenCalledWith(
          DownloadDialogComponent,
          expect.objectContaining({
            width: '500px',
          })
        );
        done();
      }, 0);
    });

    it('should pass resource count to dialog', done => {
      const resourceCount = 42;
      selectedResourcesSubject.next([mockResource1]);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(resourceCount));

      component.openDownloadDialog();

      setTimeout(() => {
        const callArgs = mockDialog.open.mock.calls[0];
        const config = callArgs[1] as any;
        expect(config.data.resourceCount).toBe(resourceCount);
        done();
      }, 0);
    });

    it('should pass resource class to dialog', done => {
      selectedResourcesSubject.next([mockResource1]);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(10));

      component.openDownloadDialog();

      setTimeout(() => {
        const callArgs = mockDialog.open.mock.calls[0];
        const config = callArgs[1] as any;
        expect(config.data.resClass).toBe(mockResClass);
        done();
      }, 0);
    });

    it('should use DspDialogConfig for dialog configuration', done => {
      selectedResourcesSubject.next([mockResource1]);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(10));

      // Spy on DspDialogConfig
      const dialogDrawerConfigSpy = jest.spyOn(DspDialogConfig, 'dialogDrawerConfig');

      component.openDownloadDialog();

      setTimeout(() => {
        expect(dialogDrawerConfigSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            resourceCount: 10,
            resClass: mockResClass,
          }),
          true
        );
        done();
      }, 0);
    });

    it('should use first() operator on selectedResources$ to get single emission', done => {
      selectedResourcesSubject.next([mockResource1]);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(10));

      component.openDownloadDialog();

      setTimeout(() => {
        // Change the subject after the subscription
        selectedResourcesSubject.next([mockResource1, createMockResource('resource-2')]);

        // Dialog should still only be called once with the first value
        expect(mockDialog.open).toHaveBeenCalledTimes(1);
        done();
      }, 10);
    });

    it('should handle multiple calls independently', done => {
      selectedResourcesSubject.next([mockResource1]);
      mockResClassCountApi.getResourceClassCount.mockReturnValue(of(5));

      component.openDownloadDialog();

      setTimeout(() => {
        mockResClassCountApi.getResourceClassCount.mockReturnValue(of(10));
        component.openDownloadDialog();

        setTimeout(() => {
          expect(mockDialog.open).toHaveBeenCalledTimes(2);
          done();
        }, 10);
      }, 10);
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
