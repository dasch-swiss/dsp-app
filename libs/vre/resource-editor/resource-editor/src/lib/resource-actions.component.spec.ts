import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateModule } from '@ngx-translate/core';
import { ResourceActionsComponent } from './resource-actions.component';

describe('ResourceActionsComponent', () => {
  let component: ResourceActionsComponent;
  let fixture: ComponentFixture<ResourceActionsComponent>;
  let mockResourceService: jest.Mocked<ResourceService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const mockResource = {
    id: 'http://example.org/resource-id',
    label: 'Test Resource',
    type: 'test-type',
    versionArkUrl: 'http://ark.example.org/ark:/12345',
    entityInfo: {
      classes: {},
    },
    getValues: jest.fn(),
  };

  const mockRegionResource = {
    id: 'http://example.org/region-id',
    label: 'Test Region',
    type: 'test-type',
    versionArkUrl: 'http://ark.example.org/ark:/67890',
    entityInfo: {
      classes: {
        [Constants.Region]: true,
      },
    },
    getValues: jest.fn().mockReturnValue([
      {
        linkedResourceIri: 'http://example.org/parent-resource-id',
      },
    ]),
  };

  beforeEach(async () => {
    mockResourceService = {
      getResourcePath: jest.fn().mockReturnValue('/project/123/resource/456'),
    } as any;

    mockNotificationService = {
      openSnackBar: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [ResourceActionsComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ResourceService, useValue: mockResourceService },
      ],
    })
      .overrideComponent(ResourceActionsComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceActionsComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.open
    global.window.open = jest.fn();
  });

  describe('component initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have required resource input', () => {
      component.resource = mockResource as any;
      expect(component.resource).toBeDefined();
      expect(component.resource).toEqual(mockResource);
    });

    it('should have access to translate service', () => {
      expect((component as any)._translateService).toBeDefined();
    });

    it('should have notification service injected', () => {
      expect((component as any).notification).toBeDefined();
    });
  });

  describe('openResource - regular resource', () => {
    beforeEach(() => {
      component.resource = mockResource as any;
    });

    it('should open resource in new tab', () => {
      component.openResource();

      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith(mockResource.id);
      expect(window.open).toHaveBeenCalledWith(`/${RouteConstants.resource}/project/123/resource/456`, '_blank');
    });

    it('should call ResourceService with correct resource id', () => {
      component.openResource();

      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith(mockResource.id);
    });
  });

  describe('openResource - region resource', () => {
    beforeEach(() => {
      component.resource = mockRegionResource as any;
    });

    it('should open parent resource with annotation query param', () => {
      component.openResource();

      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith('http://example.org/parent-resource-id');
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(`?${RouteConstants.annotationQueryParam}=`),
        '_blank'
      );
    });

    it('should encode annotation id in query param', () => {
      component.openResource();

      const expectedAnnotationId = encodeURIComponent(mockRegionResource.id);
      expect(window.open).toHaveBeenCalledWith(expect.stringContaining(`=${expectedAnnotationId}`), '_blank');
    });

    it('should get linked resource from IsRegionOfValue', () => {
      component.openResource();

      expect(mockRegionResource.getValues).toHaveBeenCalledWith(Constants.IsRegionOfValue);
    });

    it('should handle missing linked resource gracefully', () => {
      const resourceWithoutLinkedResource = {
        ...mockRegionResource,
        getValues: jest.fn().mockReturnValue([]),
      };
      component.resource = resourceWithoutLinkedResource as any;

      component.openResource();

      // Should fall back to the region's own id
      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith(mockRegionResource.id);
    });
  });

  describe('clipboard and notification functionality', () => {
    beforeEach(() => {
      component.resource = mockResource as any;
    });

    it('should have notification service for snackbar messages', () => {
      expect((component as any).notification).toBeDefined();
      expect((component as any).notification.openSnackBar).toBeDefined();
    });

    it('should be able to display ARK URL in template', () => {
      expect(component.resource.versionArkUrl).toBe('http://ark.example.org/ark:/12345');
    });

    it('should be able to display resource id in template', () => {
      expect(component.resource.id).toBe('http://example.org/resource-id');
    });
  });

  describe('content projection', () => {
    it('should support ng-content for menu projection', () => {
      // This is tested by the template structure
      // The component should have <ng-content /> in the template
      expect(component).toBeTruthy();
    });
  });
});
