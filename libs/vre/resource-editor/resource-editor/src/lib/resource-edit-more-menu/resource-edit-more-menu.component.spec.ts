import { CUSTOM_ELEMENTS_SCHEMA, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { ResourceEditMoreMenuComponent } from './resource-edit-more-menu.component';

// Mock everything at the module level
jest.mock('@dasch-swiss/dsp-js', () => ({
  Constants: {
    HasStillImageFileValue: 'http://api.knora.org/ontology/knora-api/v2#hasStillImageFileValue',
  },
  KnoraApiConnection: class MockKnoraApiConnection {},
  ReadResource: class MockReadResource {},
  DeleteResource: class MockDeleteResource {},
  CanDoResponse: class MockCanDoResponse {
    constructor(
      public canDo: boolean = true,
      public cannotDoReason?: string
    ) {}
  },
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

  const mockCanDeleteResource = jest.fn();

  const mockSearchEndpoint = {
    doSearchIncomingLinks: jest.fn().mockReturnValue(of({ resources: [] })),
    doSearchStillImageRepresentationsCount: jest.fn().mockReturnValue(of({ numberOfResults: 0 })),
    doSearchIncomingRegions: jest.fn().mockReturnValue(of({ resources: [] })),
  };

  const mockDspApiConnection = {
    v2: {
      search: mockSearchEndpoint,
      res: {
        canDeleteResource: mockCanDeleteResource,
      },
    },
  };

  const userCanDelete$ = new BehaviorSubject(true);
  const mockResourceFetcher = { userCanDelete$ };

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

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    userCanDelete$.next(true);
    const CanDoResponse = jest.requireMock('@dasch-swiss/dsp-js').CanDoResponse;
    mockCanDeleteResource.mockReturnValue(of(new CanDoResponse(true)));
  });

  describe('business logic', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should call ngOnInit and set up resourceCanBeDeleted$ observable', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(component.resourceCanBeDeleted$).toBeDefined();
    });

    it('should return CanDoResponse from _canDeleteResource$', async () => {
      // Arrange
      const CanDoResponse = jest.requireMock('@dasch-swiss/dsp-js').CanDoResponse;
      const mockCanDoResponse = new CanDoResponse(true);
      mockCanDeleteResource.mockReturnValue(of(mockCanDoResponse));

      // Act
      const result$ = (component as any)._canDeleteResource$(mockResource);
      const response = await firstValueFrom(result$);

      // Assert
      expect(response).toBeInstanceOf(CanDoResponse);
      expect((response as any).canDo).toBe(true);
      expect(mockCanDeleteResource).toHaveBeenCalled();
    });

    it('should return canDo false when user lacks permission', async () => {
      // Arrange
      userCanDelete$.next(false);
      component.ngOnInit();

      // Act & Assert
      const response = await firstValueFrom(component.resourceCanBeDeleted$);
      expect(response).toBeDefined();
      expect(response.canDo).toBe(false);
      expect(response.cannotDoReason).toBe('You do not have permission to delete this resource.');
    });

    it('should return canDo true when user has permission and resource can be deleted', async () => {
      // Arrange
      const CanDoResponse = jest.requireMock('@dasch-swiss/dsp-js').CanDoResponse;
      const mockCanDoResponse = new CanDoResponse(true);
      mockCanDeleteResource.mockReturnValue(of(mockCanDoResponse));
      userCanDelete$.next(true);
      component.ngOnInit();

      // Act & Assert
      const response = await firstValueFrom(component.resourceCanBeDeleted$);
      expect(response).toBeDefined();
      expect(response.canDo).toBe(true);
    });

    it('should return resource cannot be deleted response when API returns canDo false', async () => {
      // Arrange
      const CanDoResponse = jest.requireMock('@dasch-swiss/dsp-js').CanDoResponse;
      const mockCanDoResponse = new CanDoResponse(false, 'Resource has dependencies');
      mockCanDeleteResource.mockReturnValue(of(mockCanDoResponse));
      userCanDelete$.next(true);
      component.ngOnInit();

      // Act & Assert
      const response = await firstValueFrom(component.resourceCanBeDeleted$);
      expect(response).toBeDefined();
      expect(response.canDo).toBe(false);
      expect(response.cannotDoReason).toBe('Resource has dependencies');
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
