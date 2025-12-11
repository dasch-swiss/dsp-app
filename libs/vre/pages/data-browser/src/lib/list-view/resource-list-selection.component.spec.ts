import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ReadResource, ReadUser } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MultipleViewerService } from '../comparison/multiple-viewer.service';
import { ResourceLinkDialogComponent, ResourceLinkDialogProps } from './resource-link-dialog.component';
import { ResourceListSelectionComponent } from './resource-list-selection.component';

describe('ResourceListSelectionComponent', () => {
  let component: ResourceListSelectionComponent;
  let fixture: ComponentFixture<ResourceListSelectionComponent>;
  let mockMultipleViewerService: jest.Mocked<MultipleViewerService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockTranslateService: jest.Mocked<TranslateService>;
  let mockDialog: jest.Mocked<MatDialog>;

  // Mock subjects for reactive streams
  let selectedResourcesSubject: BehaviorSubject<ReadResource[]>;
  let userSubject: BehaviorSubject<ReadUser | null>;
  let isSysAdminSubject: BehaviorSubject<boolean>;

  // Mock resources
  const createMockResource = (id: string, projectUuid: string): ReadResource =>
    ({
      id,
      attachedToProject: projectUuid,
      type: 'http://api.knora.org/ontology/knora-api/v2#Resource',
      label: `Resource ${id}`,
    }) as ReadResource;

  const mockResource1 = createMockResource('resource-1', 'project-uuid-1');
  const mockResource2 = createMockResource('resource-2', 'project-uuid-1');
  const mockResource3 = createMockResource('resource-3', 'project-uuid-2');

  // Mock user
  const createMockUser = (id: string, projectMemberships: string[] = []): ReadUser =>
    ({
      id,
      permissions: {
        groupsPerProject: projectMemberships.reduce(
          (acc, projectIri) => ({
            ...acc,
            [projectIri]: [`http://www.knora.org/ontology/knora-admin#ProjectMember`],
          }),
          {}
        ),
      },
    }) as ReadUser;

  beforeEach(async () => {
    // Initialize subjects
    selectedResourcesSubject = new BehaviorSubject<ReadResource[]>([]);
    userSubject = new BehaviorSubject<ReadUser | null>(null);
    isSysAdminSubject = new BehaviorSubject<boolean>(false);

    // Create mock services
    mockMultipleViewerService = {
      selectedResources$: selectedResourcesSubject.asObservable(),
      reset: jest.fn(),
      selectMode: false,
      addResources: jest.fn(),
      removeResources: jest.fn(),
      selectOneResource: jest.fn(),
    } as any;

    mockUserService = {
      user$: userSubject.asObservable(),
      isSysAdmin$: isSysAdminSubject.asObservable(),
    } as any;

    mockTranslateService = {
      instant: jest.fn((key: string) => {
        const translations: Record<string, string> = {
          'pages.dataBrowser.resourceListSelection.noResourcesSelected': 'No resources selected',
          'pages.dataBrowser.resourceListSelection.resourcesMustBeSameProject':
            'Resources must be from the same project',
          'pages.dataBrowser.resourceListSelection.createLinkObjectTooltip':
            'A link object can be created only between resources belonging to the same project.',
        };
        return translations[key] || key;
      }),
    } as any;

    mockDialog = {
      open: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ResourceListSelectionComponent, TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: MultipleViewerService, useValue: mockMultipleViewerService },
        { provide: UserService, useValue: mockUserService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    })
      .overrideComponent(ResourceListSelectionComponent, {
        set: {
          // Template is overridden to isolate unit test from template rendering
          // This tests only the component logic, not UI integration
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceListSelectionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('count$', () => {
    it('should emit the number of selected resources', done => {
      selectedResourcesSubject.next([mockResource1, mockResource2]);

      component.count$.subscribe(count => {
        expect(count).toBe(2);
        done();
      });
    });

    it('should emit 0 when no resources are selected', done => {
      selectedResourcesSubject.next([]);

      component.count$.subscribe(count => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('showCreateLink$', () => {
    it('should return false when count is 0', done => {
      selectedResourcesSubject.next([]);
      userSubject.next(createMockUser('user-1', ['project-uuid-1']));
      isSysAdminSubject.next(false);

      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(false);
        done();
      });
    });

    it('should return false when count is 1', done => {
      selectedResourcesSubject.next([mockResource1]);
      userSubject.next(createMockUser('user-1', ['project-uuid-1']));
      isSysAdminSubject.next(false);

      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(false);
        done();
      });
    });

    it('should return false when user is null', done => {
      selectedResourcesSubject.next([mockResource1, mockResource2]);
      userSubject.next(null);
      isSysAdminSubject.next(false);

      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(false);
        done();
      });
    });

    it('should return true when user is sys admin with 2+ resources', done => {
      selectedResourcesSubject.next([mockResource1, mockResource2]);
      userSubject.next(createMockUser('user-1'));
      isSysAdminSubject.next(true);

      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(true);
        done();
      });
    });

    it('should return true when user is project member with 2+ resources from their project', done => {
      selectedResourcesSubject.next([mockResource1, mockResource2]);
      userSubject.next(createMockUser('user-1', ['project-uuid-1']));
      isSysAdminSubject.next(false);

      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(true);
        done();
      });
    });

    it('should return false when user is not a member of any selected resource project', done => {
      selectedResourcesSubject.next([mockResource1, mockResource2]);
      userSubject.next(createMockUser('user-1', ['project-uuid-999']));
      isSysAdminSubject.next(false);

      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(false);
        done();
      });
    });

    it('should return true when user is a member of ANY selected resource project (mixed projects)', done => {
      selectedResourcesSubject.next([mockResource1, mockResource3]); // Different projects
      userSubject.next(createMockUser('user-1', ['project-uuid-1'])); // Member of first project only
      isSysAdminSubject.next(false);

      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(true); // Should show because user has rights on one of the projects
        done();
      });
    });

    it('should return true for sys admin even with resources from different projects', done => {
      selectedResourcesSubject.next([mockResource1, mockResource3]); // Different projects
      userSubject.next(createMockUser('user-1'));
      isSysAdminSubject.next(true);

      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(true);
        done();
      });
    });
  });

  describe('isCreateLinkButtonDisabled$', () => {
    it('should return disabled with reason when no resources selected', done => {
      selectedResourcesSubject.next([]);

      component.isCreateLinkButtonDisabled$.subscribe(state => {
        expect(state.disabled).toBe(true);
        expect(state.reason).toBe('No resources selected');
        expect(mockTranslateService.instant).toHaveBeenCalledWith(
          'pages.dataBrowser.resourceListSelection.noResourcesSelected'
        );
        done();
      });
    });

    it('should return disabled with reason when resources are from different projects', done => {
      selectedResourcesSubject.next([mockResource1, mockResource3]); // Different projects

      component.isCreateLinkButtonDisabled$.subscribe(state => {
        expect(state.disabled).toBe(true);
        expect(state.reason).toBe('Resources must be from the same project');
        expect(mockTranslateService.instant).toHaveBeenCalledWith(
          'pages.dataBrowser.resourceListSelection.resourcesMustBeSameProject'
        );
        done();
      });
    });

    it('should return not disabled when all resources are from the same project', done => {
      selectedResourcesSubject.next([mockResource1, mockResource2]); // Same project

      component.isCreateLinkButtonDisabled$.subscribe(state => {
        expect(state.disabled).toBe(false);
        expect(state.reason).toBeUndefined();
        done();
      });
    });

    it('should return not disabled for a single resource', done => {
      selectedResourcesSubject.next([mockResource1]);

      component.isCreateLinkButtonDisabled$.subscribe(state => {
        expect(state.disabled).toBe(false);
        expect(state.reason).toBeUndefined();
        done();
      });
    });
  });

  describe('reset', () => {
    it('should call multipleViewerService.reset()', () => {
      component.reset();

      expect(mockMultipleViewerService.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('openCreateLinkDialog', () => {
    it('should open dialog with correct data', () => {
      const resources = [mockResource1, mockResource2];

      component.openCreateLinkDialog(resources);

      expect(mockDialog.open).toHaveBeenCalledWith(ResourceLinkDialogComponent, {
        data: {
          resources,
          projectUuid: 'project-uuid-1',
        },
      });
    });

    it('should use the first resource project UUID', () => {
      const resources = [mockResource1, mockResource2];

      component.openCreateLinkDialog(resources);

      const callArgs = mockDialog.open.mock.calls[0];
      const dialogConfig = callArgs[1] as { data: ResourceLinkDialogProps };

      expect(dialogConfig.data.projectUuid).toBe('project-uuid-1');
    });
  });

  describe('Integration: showCreateLink$ and isCreateLinkButtonDisabled$', () => {
    it('should show button as enabled when sys admin with same-project resources', done => {
      // Set up initial state
      selectedResourcesSubject.next([mockResource1, mockResource2]);
      userSubject.next(createMockUser('user-1'));
      isSysAdminSubject.next(true);

      // Check showCreateLink$ first
      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(true);

        // Then check button state
        component.isCreateLinkButtonDisabled$.subscribe(state => {
          expect(state.disabled).toBe(false);
          expect(state.reason).toBeUndefined();
          done();
        });
      });
    });

    it('should show button as disabled when sys admin with different-project resources', done => {
      // Set up initial state
      selectedResourcesSubject.next([mockResource1, mockResource3]); // Different projects
      userSubject.next(createMockUser('user-1'));
      isSysAdminSubject.next(true);

      // Check showCreateLink$ first
      component.showCreateLink$.subscribe(show => {
        expect(show).toBe(true);

        // Then check button is disabled
        component.isCreateLinkButtonDisabled$.subscribe(state => {
          expect(state.disabled).toBe(true);
          expect(state.reason).toBe('Resources must be from the same project');
          done();
        });
      });
    });
  });
});
