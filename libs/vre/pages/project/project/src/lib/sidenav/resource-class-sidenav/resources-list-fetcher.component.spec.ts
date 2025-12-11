import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadProject, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { MultipleViewerService } from '@dasch-swiss/vre/pages/data-browser';
import { DataBrowserPageService, ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { OntologyService, ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { ResourcesListFetcherComponent } from './resources-list-fetcher.component';

describe('ResourcesListFetcherComponent', () => {
  let component: ResourcesListFetcherComponent;
  let fixture: ComponentFixture<ResourcesListFetcherComponent>;
  let mockDspApiConnection: any;
  let mockResourceResult: any;
  let mockMultipleViewerService: any;
  let routeParamsSubject: BehaviorSubject<any>;
  let currentProjectSubject: BehaviorSubject<ReadProject>;

  const mockResource1 = { id: 'resource-1', label: 'Resource 1' } as ReadResource;
  const mockResource2 = { id: 'resource-2', label: 'Resource 2' } as ReadResource;
  const mockProject = { shortcode: '0001' } as ReadProject;

  beforeEach(async () => {
    routeParamsSubject = new BehaviorSubject({ [RouteConstants.classParameter]: 'TestClass' });
    currentProjectSubject = new BehaviorSubject(mockProject);

    mockDspApiConnection = {
      v2: {
        search: {
          doExtendedSearch: jest.fn().mockReturnValue(of({ resources: [] })),
          doExtendedSearchCountQuery: jest.fn().mockReturnValue(of({ numberOfResults: 0 })),
        },
      },
    };

    mockResourceResult = {
      updatePageIndex: jest.fn(),
      pageIndex$: of(0),
      numberOfResults: 0,
    };

    mockMultipleViewerService = {
      selectOneResource: jest.fn(),
      reset: jest.fn(),
      selectMode: false,
      selectedResources$: of([]),
    };

    await TestBed.configureTestingModule({
      imports: [ResourcesListFetcherComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: { params: routeParamsSubject.asObservable() } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: ResourceResultService, useValue: mockResourceResult },
        { provide: OntologyService, useValue: { getIriBaseUrl: () => 'http://api.knora.org' } },
        { provide: ProjectPageService, useValue: { currentProject$: currentProjectSubject.asObservable() } },
        { provide: MultipleViewerService, useValue: mockMultipleViewerService },
        { provide: DataBrowserPageService, useValue: { onNavigationReload$: of(undefined) } },
      ],
    })
      .overrideComponent(ResourcesListFetcherComponent, {
        set: { template: '<div>Mock</div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourcesListFetcherComponent);
    component = fixture.componentInstance;
    component.ontologyLabel = 'testonto';
    component.classLabel = 'TestClass';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should auto-select first resource when class has resources', async () => {
    mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1, mockResource2] }));
    mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 2 }));

    component.ngOnChanges();

    await firstValueFrom(component.data$);

    expect(mockMultipleViewerService.selectOneResource).toHaveBeenCalledWith(mockResource1);
  });

  it('should call reset when navigating to empty class', async () => {
    mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [] }));
    mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 0 }));

    component.ngOnChanges();

    await firstValueFrom(component.data$);

    expect(mockMultipleViewerService.reset).toHaveBeenCalled();
  });

  it('should not auto-select when selectMode is true', async () => {
    mockMultipleViewerService.selectMode = true;
    mockDspApiConnection.v2.search.doExtendedSearch.mockReturnValue(of({ resources: [mockResource1, mockResource2] }));
    mockDspApiConnection.v2.search.doExtendedSearchCountQuery.mockReturnValue(of({ numberOfResults: 2 }));

    component.ngOnChanges();

    await firstValueFrom(component.data$);

    expect(mockMultipleViewerService.selectOneResource).not.toHaveBeenCalled();
  });
});
