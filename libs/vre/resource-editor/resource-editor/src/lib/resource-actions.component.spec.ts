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
    global.window.open = jest.fn();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('openResource - regular resource', () => {
    it('should open regular resource in new tab with correct path', () => {
      component.resource = mockResource as any;

      component.openResource();

      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith(mockResource.id);
      expect(window.open).toHaveBeenCalledWith(`/${RouteConstants.resource}/project/123/resource/456`, '_blank');
    });
  });

  describe('openResource - region resource', () => {
    it('should open parent resource with annotation query param and encoded ID', () => {
      component.resource = mockRegionResource as any;

      component.openResource();

      // Verify it gets the linked resource from the region
      expect(mockRegionResource.getValues).toHaveBeenCalledWith(Constants.IsRegionOfValue);

      // Verify it uses the parent resource ID
      expect(mockResourceService.getResourcePath).toHaveBeenCalledWith('http://example.org/parent-resource-id');

      // Verify URL includes annotation query param with encoded region ID
      const expectedAnnotationId = encodeURIComponent(mockRegionResource.id);
      expect(window.open).toHaveBeenCalledWith(
        `/${RouteConstants.resource}/project/123/resource/456?${RouteConstants.annotationQueryParam}=${expectedAnnotationId}`,
        '_blank'
      );
    });

    it('should handle missing linked resource by falling back to region ID', () => {
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
});
