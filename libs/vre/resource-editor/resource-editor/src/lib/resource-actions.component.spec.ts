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
          // Template is overridden to isolate unit test from template rendering
          // This tests only the component logic, not UI integration
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceActionsComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('getResourceLink - regular resource', () => {
    it('should return correct path array for regular resource', () => {
      component.resource = mockResource as any;

      const result = component.getResourceLink();

      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith(mockResource.id);
      expect(result).toEqual(['/', RouteConstants.resource, 'project', '123', 'resource', '456']);
    });
  });

  describe('getResourceLink - region resource', () => {
    it('should return parent resource path array for region', () => {
      component.resource = mockRegionResource as any;

      const result = component.getResourceLink();

      // Verify it gets the linked resource from the region
      expect(mockRegionResource.getValues).toHaveBeenCalledWith(Constants.IsRegionOfValue);

      // Verify it uses the parent resource ID
      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith('http://example.org/parent-resource-id');

      // Verify correct path array is returned
      expect(result).toEqual(['/', RouteConstants.resource, 'project', '123', 'resource', '456']);
    });

    it('should handle missing linked resource by falling back to region ID', () => {
      const resourceWithoutLinkedResource = {
        ...mockRegionResource,
        getValues: jest.fn().mockReturnValue([]),
      };
      component.resource = resourceWithoutLinkedResource as any;

      component.getResourceLink();

      // Should fall back to the region's own id
      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith(mockRegionResource.id);
    });
  });

  describe('getResourceQueryParams - regular resource', () => {
    it('should return null for regular resource (no query params needed)', () => {
      component.resource = mockResource as any;

      const result = component.getResourceQueryParams();

      expect(result).toBeNull();
    });
  });

  describe('getResourceQueryParams - region resource', () => {
    it('should return annotation query param with encoded region ID', () => {
      component.resource = mockRegionResource as any;

      const result = component.getResourceQueryParams();

      const expectedAnnotationId = encodeURIComponent(mockRegionResource.id);
      expect(result).toEqual({
        [RouteConstants.annotationQueryParam]: expectedAnnotationId,
      });
    });

    it('should return annotation query param even without linked resource', () => {
      const resourceWithoutLinkedResource = {
        ...mockRegionResource,
        getValues: jest.fn().mockReturnValue([]),
      };
      component.resource = resourceWithoutLinkedResource as any;

      const result = component.getResourceQueryParams();

      const expectedAnnotationId = encodeURIComponent(mockRegionResource.id);
      expect(result).toEqual({
        [RouteConstants.annotationQueryParam]: expectedAnnotationId,
      });
    });
  });
});
