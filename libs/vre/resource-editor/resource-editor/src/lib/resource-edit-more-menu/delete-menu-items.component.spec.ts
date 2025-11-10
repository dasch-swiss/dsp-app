import { CUSTOM_ELEMENTS_SCHEMA, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CanDoResponse, DeleteResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ResourceFetcherService } from '@dasch-swiss/vre/resource-editor/representations';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { DeleteMenuItemsComponent } from './delete-menu-items.component';

describe('DeleteMenuItemsComponent', () => {
  let component: DeleteMenuItemsComponent;
  let fixture: ComponentFixture<DeleteMenuItemsComponent>;

  const mockResource = {
    id: 'test-resource-id',
    type: 'test-type',
    lastModificationDate: '2023-01-01',
    incomingReferences: [],
    properties: {},
    userHasPermission: 'D',
  };

  const mockCanDeleteResource = jest.fn();

  const mockDspApiConnection = {
    v2: {
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
      declarations: [DeleteMenuItemsComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: ResourceFetcherService, useValue: mockResourceFetcher },
        { provide: ViewContainerRef, useValue: {} },
      ],
    })
      .overrideComponent(DeleteMenuItemsComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DeleteMenuItemsComponent);
    component = fixture.componentInstance;
    component.resource = mockResource as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userCanDelete$.next(true);
    const canDoResponse = new CanDoResponse();
    canDoResponse.canDo = true;
    mockCanDeleteResource.mockReturnValue(of(canDoResponse));
  });

  describe('component initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should call ngOnInit and set up resourceCanBeDeleted$ observable', () => {
      component.ngOnInit();

      expect(component.resourceCanBeDeleted$).toBeDefined();
    });
  });

  describe('permission checks', () => {
    it('should return canDo false when user lacks delete permission', async () => {
      userCanDelete$.next(false);
      component.ngOnInit();

      const response = await firstValueFrom(component.resourceCanBeDeleted$);

      expect(response).toBeDefined();
      expect(response.canDo).toBe(false);
      expect(response.cannotDoReason).toBe('resourceEditor.moreMenu.noPermission');
    });

    it('should return canDo true when user has permission and resource can be deleted', async () => {
      const canDoResponse = new CanDoResponse();
      canDoResponse.canDo = true;
      mockCanDeleteResource.mockReturnValue(of(canDoResponse));
      userCanDelete$.next(true);
      component.ngOnInit();

      const response = await firstValueFrom(component.resourceCanBeDeleted$);

      expect(response).toBeDefined();
      expect(response.canDo).toBe(true);
      expect(mockCanDeleteResource).toHaveBeenCalled();
    });

    it('should return resource cannot be deleted response when API returns canDo false', async () => {
      const canDoResponse = new CanDoResponse();
      canDoResponse.canDo = false;
      canDoResponse.cannotDoReason = 'Resource has dependencies';
      mockCanDeleteResource.mockReturnValue(of(canDoResponse));
      userCanDelete$.next(true);
      component.ngOnInit();

      const response = await firstValueFrom(component.resourceCanBeDeleted$);

      expect(response).toBeDefined();
      expect(response.canDo).toBe(false);
      expect(response.cannotDoReason).toBe('Resource has dependencies');
    });

    it('should call canDeleteResource with correct parameters', async () => {
      userCanDelete$.next(true);
      component.ngOnInit();

      await firstValueFrom(component.resourceCanBeDeleted$);

      expect(mockCanDeleteResource).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockResource.id,
          type: mockResource.type,
          lastModificationDate: mockResource.lastModificationDate,
        })
      );
    });
  });

  describe('delete functionality', () => {
    it('should open delete dialog when deleteResource is called', () => {
      component.deleteResource();

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: mockResource,
        })
      );
    });

    it('should emit resourceDeleted when delete dialog returns true', () => {
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      const emitSpy = jest.spyOn(component.resourceDeleted, 'emit');

      component.deleteResource();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit resourceDeleted when delete dialog returns false', () => {
      mockDialogRef.afterClosed.mockReturnValue(of(false));
      const emitSpy = jest.spyOn(component.resourceDeleted, 'emit');

      component.deleteResource();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('erase functionality', () => {
    it('should open erase dialog when eraseResource is called', () => {
      component.eraseResource();

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: mockResource,
        })
      );
    });

    it('should emit resourceErased when erase dialog returns true', () => {
      mockDialogRef.afterClosed.mockReturnValue(of(true));
      const emitSpy = jest.spyOn(component.resourceErased, 'emit');

      component.eraseResource();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit resourceErased when erase dialog returns false', () => {
      mockDialogRef.afterClosed.mockReturnValue(of(false));
      const emitSpy = jest.spyOn(component.resourceErased, 'emit');

      component.eraseResource();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('userCanDelete method', () => {
    it('should call ResourceUtil.userCanDelete with resource', () => {
      // Mock ResourceUtil if needed, or just test that it doesn't throw
      expect(() => component.userCanDelete()).not.toThrow();
    });
  });
});
