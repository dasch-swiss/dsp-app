import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanDoResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
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

  const projectIri$ = new BehaviorSubject('http://test-project');
  const userCanDelete$ = new BehaviorSubject(true);
  const mockResourceFetcher = {
    projectIri$,
    userCanDelete$,
  };

  const user$ = new BehaviorSubject({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    projectsAdmin: ['http://test-project'],
  });
  const mockUserService = { user$ };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeleteMenuItemsComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: ResourceFetcherService, useValue: mockResourceFetcher },
        { provide: UserService, useValue: mockUserService },
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
    user$.next({
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      projectsAdmin: ['http://test-project'],
    } as any);
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
    it('should return canDo true when resource can be deleted', async () => {
      const canDoResponse = new CanDoResponse();
      canDoResponse.canDo = true;
      mockCanDeleteResource.mockReturnValue(of(canDoResponse));
      component.ngOnInit();

      const response = await firstValueFrom(component.resourceCanBeDeleted$);

      expect(response).toBeDefined();
      expect(response.canDo).toBe(true);
      expect(mockCanDeleteResource).toHaveBeenCalled();
    });

    it('should return canDo false when resource cannot be deleted', async () => {
      const canDoResponse = new CanDoResponse();
      canDoResponse.canDo = false;
      canDoResponse.cannotDoReason = 'Resource has dependencies';
      mockCanDeleteResource.mockReturnValue(of(canDoResponse));
      component.ngOnInit();

      const response = await firstValueFrom(component.resourceCanBeDeleted$);

      expect(response).toBeDefined();
      expect(response.canDo).toBe(false);
      expect(response.cannotDoReason).toBe('Resource has dependencies');
    });

    it('should call canDeleteResource with correct parameters', async () => {
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

  describe('event emission', () => {
    it('should expose resourceDeleted output', () => {
      expect(component.resourceDeleted).toBeDefined();
      expect(component.resourceDeleted).toBeInstanceOf(EventEmitter);
    });

    it('should expose resourceErased output', () => {
      expect(component.resourceErased).toBeDefined();
      expect(component.resourceErased).toBeInstanceOf(EventEmitter);
    });

    it('should emit resourceDeleted when triggered', done => {
      component.resourceDeleted.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component.resourceDeleted.emit();
    });

    it('should emit resourceErased when triggered', done => {
      component.resourceErased.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component.resourceErased.emit();
    });
  });

  describe('component orchestration', () => {
    it('should have access to resourceFetcher', () => {
      expect(component.resourceFetcher).toBeDefined();
      expect(component.resourceFetcher.userCanDelete$).toBeDefined();
      expect(component.resourceFetcher.projectIri$).toBeDefined();
    });

    it('should initialize resourceCanBeDeleted$ on ngOnInit', () => {
      expect(component.resourceCanBeDeleted$).toBeUndefined();

      component.ngOnInit();

      expect(component.resourceCanBeDeleted$).toBeDefined();
    });
  });
});
