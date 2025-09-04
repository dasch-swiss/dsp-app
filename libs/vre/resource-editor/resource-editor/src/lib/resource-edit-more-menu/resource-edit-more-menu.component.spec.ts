import { CUSTOM_ELEMENTS_SCHEMA, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { BehaviorSubject, of } from 'rxjs';
import { ResourceEditMoreMenuComponent } from './resource-edit-more-menu.component';

// Mock everything at the module level
jest.mock('@dasch-swiss/dsp-js', () => ({
  Constants: {
    HasStillImageFileValue: 'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue',
  },
  KnoraApiConnection: class MockKnoraApiConnection {},
  ReadResource: class MockReadResource {},
}));

jest.mock('@angular/material/dialog', () => ({
  MatDialog: class MockMatDialog {},
}));

jest.mock('@dasch-swiss/vre/core/config', () => ({
  DspApiConnectionToken: 'DspApiConnectionToken',
}));

jest.mock('@dasch-swiss/vre/resource-editor/properties-display', () => ({
  DeleteResourceDialogComponent: class MockDeleteResourceDialogComponent {},
}));

jest.mock('@dasch-swiss/vre/resource-editor/representations', () => ({
  ResourceFetcherService: class MockResourceFetcherService {},
}));

jest.mock('@dasch-swiss/vre/resource-editor/resource-properties', () => ({
  EditResourceLabelDialogComponent: class MockEditResourceLabelDialogComponent {},
  EraseResourceDialogComponent: class MockEraseResourceDialogComponent {},
}));

describe('ResourceEditMoreMenuComponent', () => {
  let component: ResourceEditMoreMenuComponent;
  let fixture: ComponentFixture<ResourceEditMoreMenuComponent>;

  const mockResource = {
    id: 'test-resource-id',
    incomingReferences: [],
    properties: {},
  };

  const mockSearchEndpoint = {
    doSearchIncomingLinks: jest.fn().mockReturnValue(of({ resources: [] })),
    doSearchStillImageRepresentationsCount: jest.fn().mockReturnValue(of({ numberOfResults: 0 })),
    doSearchIncomingRegions: jest.fn().mockReturnValue(of({ resources: [] })),
  };

  const mockDspApiConnection = {
    v2: { search: mockSearchEndpoint },
  };

  const userCanDelete$ = new BehaviorSubject(true);
  const mockResourceFetcher = { userCanDelete$ };

  const mockStore = {
    select: jest.fn().mockReturnValue(of(false)),
  };

  const mockDialogRef = {
    afterClosed: jest.fn().mockReturnValue(of(false)),
  };

  const mockDialog = {
    open: jest.fn().mockReturnValue(mockDialogRef),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourceEditMoreMenuComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: ResourceFetcherService, useValue: mockResourceFetcher },
        { provide: ViewContainerRef, useValue: {} },
      ],
    })
      .overrideComponent(ResourceEditMoreMenuComponent, {
        set: {
          template: '<div>Mock Template</div>', // Override template for unit testing
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceEditMoreMenuComponent);
    component = fixture.componentInstance;
    component.resource = mockResource as any;
  });

  describe('business logic', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should set resourceCanBeDeleted to false when user lacks permission', () => {
      // Arrange
      userCanDelete$.next(false);

      // Act
      component.checkResourceCanBeDeleted();

      // Assert
      expect(component.resourceCanBeDeleted).toEqual({
        canDo: false,
        reason: 'You do not have permission to delete this resource.',
      });
    });

    it('should set resourceCanBeDeleted to false when resource has incoming references', () => {
      // Arrange
      const resourceWithReferences = { ...mockResource, incomingReferences: [{}] };
      component.resource = resourceWithReferences as any;
      userCanDelete$.next(true);

      // Act
      component.checkResourceCanBeDeleted();

      // Assert
      expect(component.resourceCanBeDeleted).toEqual({
        canDo: false,
        reason: 'This resource cannot be deleted as it has incoming references.',
      });
    });

    it('should set resourceCanBeDeleted to true when all conditions are met', () => {
      // Arrange
      userCanDelete$.next(true);
      mockSearchEndpoint.doSearchIncomingLinks.mockReturnValue(of({ resources: [] }));
      mockSearchEndpoint.doSearchStillImageRepresentationsCount.mockReturnValue(of({ numberOfResults: 0 }));

      // Act
      component.checkResourceCanBeDeleted();

      // Assert
      expect(component.resourceCanBeDeleted).toEqual({
        canDo: true,
        reason: 'Resource can be deleted.',
      });
    });

    it('should emit resourceDeleted when delete dialog returns true', () => {
      // Arrange
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      const emitSpy = jest.spyOn(component.resourceDeleted, 'emit');

      // Act
      component.deleteResource();

      // Assert
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit resourceUpdated when edit label dialog returns true', () => {
      // Arrange
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      const emitSpy = jest.spyOn(component.resourceUpdated, 'emit');

      // Act
      component.editResourceLabel();

      // Assert
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit when dialogs return false', () => {
      // Arrange
      mockDialogRef.afterClosed.mockReturnValue(of(false));
      const deletedSpy = jest.spyOn(component.resourceDeleted, 'emit');
      const updatedSpy = jest.spyOn(component.resourceUpdated, 'emit');

      // Act
      component.deleteResource();
      component.editResourceLabel();

      // Assert
      expect(deletedSpy).not.toHaveBeenCalled();
      expect(updatedSpy).not.toHaveBeenCalled();
    });
  });
});
