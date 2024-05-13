import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  ApiResponseData,
  CanDoResponse,
  ClassDefinition,
  IHasProperty,
  ListNodeInfo,
  ListsEndpointAdmin,
  ListsResponse,
  MockOntology,
  MockProjects,
  MockUsers,
  OntologiesEndpointV2,
  OntologiesMetadata,
  ProjectResponse,
  ProjectsEndpointAdmin,
  ReadOntology,
  ResourcePropertyDefinitionWithAllLanguages,
  UsersEndpointAdmin,
} from '@dasch-swiss/dsp-js';
import { AppConfigService, DspApiConfigToken, DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { SplitPipe } from '@dsp-app/src/app/main/pipes/split.pipe';
import { TruncatePipe } from '@dsp-app/src/app/main/pipes/string-transformation/truncate.pipe';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { TestConfig } from '@dsp-app/src/test.config';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { OntologyComponent } from './ontology.component';

/**
 * mock ResourceClassInfo.
 */
@Component({
  selector: 'app-resource-class-info',
})
class MockResourceClassInfoComponent {
  @Input() expanded = false;

  @Input() resourceClass: ClassDefinition;

  @Input() projectUuid: string;

  @Input() projectStatus: boolean;

  @Input() ontologies: ReadOntology[] = [];

  @Input() lastModificationDate?: string;

  @Input() userCanEdit: boolean;
}

/**
 * mock PropertyInfo.
 */
@Component({
  selector: 'app-property-info',
})
class MockPropertyInfoComponent {
  @Input() propDef: ResourcePropertyDefinitionWithAllLanguages;

  @Input() propCard?: IHasProperty;

  @Input() resourceIri?: string;

  @Input() projectUuid: string;

  @Input() projectStatus: boolean;

  @Input() lastModificationDate?: string;

  @Input() userCanEdit: boolean;
}

@Component({
  template: '<app-ontology></app-ontology>',
})
class TestHostComponent {}

describe('OntologyComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  const appInitSpy = {
    dspAppConfig: {
      iriBase: 'http://rdfh.ch',
    },
  };

  beforeEach(waitForAsync(() => {
    const apiSpyObj = {
      admin: {
        listsEndpoint: jasmine.createSpyObj('listsEndpoint', ['getListsInProject']),
        usersEndpoint: jasmine.createSpyObj('usersEndpoint', ['getUserByUsername']),
        projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', ['getProjectByIri']),
      },
      v2: {
        onto: jasmine.createSpyObj('onto', [
          'getOntologiesByProjectIri',
          'getOntology',
          'canDeleteOntology',
          'deleteOntology',
          'deleteResourceClass',
          'deleteResourceProperty',
        ]),
      },
    };

    const applicationStateServiceSpy = jasmine.createSpyObj('ApplicationStateService', ['get', 'set']);

    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['iriToUuid', 'uuidToIri']);

    TestBed.configureTestingModule({
      declarations: [
        OntologyComponent,
        DialogComponent,
        StatusComponent,
        MockPropertyInfoComponent,
        MockResourceClassInfoComponent,
        TruncatePipe,
        SplitPipe,
      ],
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MatCardModule,
        MatDialogModule,
        MatDividerModule,
        MatFormFieldModule,
        MatIconModule,
        MatMenuModule,
        MatOptionModule,
        MatSelectModule,
        MatSnackBarModule,
        MatToolbarModule,
        MatTooltipModule,
        ReactiveFormsModule,
        RouterTestingModule,
      ],
      providers: [
        {
          provide: AppConfigService,
          useValue: appInitSpy,
        },
        {
          provide: ProjectService,
          useValue: projectServiceSpy,
        },
        {
          provide: DspApiConfigToken,
          useValue: TestConfig.ApiConfig,
        },
        {
          provide: DspApiConnectionToken,
          useValue: apiSpyObj,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              paramMap: of({
                get: (param: string) => {
                  if (param === 'uuid') {
                    return TestConfig.ProjectUuid;
                  }
                },
              }),
              snapshot: {
                params: { uuid: '0001' },
                url: [{ path: 'project' }],
              },
            },
            params: of({
              onto: 'anything',
            }),
          },
        },
        {
          provide: ApplicationStateService,
          useValue: applicationStateServiceSpy,
        },
      ],
    }).compileComponents();
  }));

  // mock localStorage
  beforeEach(() => {
    let store = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string): string => store[key] || null);
    spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
      delete store[key];
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string): string => (store[key] = <any>value));
    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });
  });

  beforeEach(() => {
    // set local storage session data
    localStorage.setItem('session', JSON.stringify(TestConfig.CurrentSession));

    // mock application state service for currentOntology
    const cacheSpyOnto = TestBed.inject(ApplicationStateService);
    (cacheSpyOnto as jasmine.SpyObj<ApplicationStateService>).get.withArgs('currentOntology').and.callFake(() => {
      const response: ReadOntology = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
      return of(response);
    });

    // mock application state service for currentProjectOntologies
    const cacheSpyProjOnto = TestBed.inject(ApplicationStateService);
    (cacheSpyProjOnto as jasmine.SpyObj<ApplicationStateService>).get
      .withArgs('currentProjectOntologies')
      .and.callFake(() => {
        const ontologies: ReadOntology[] = [];
        ontologies.push(MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2'));
        ontologies.push(MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/minimal/v2'));
        const response: ReadOntology[] = ontologies;
        return of(response);
      });

    // mock application state service for currentOntologyLists
    const cacheSpyOntoLists = TestBed.inject(ApplicationStateService);

    (cacheSpyOntoLists as jasmine.SpyObj<ApplicationStateService>).get
      .withArgs('currentOntologyLists')
      .and.callFake(() => {
        const response: ListNodeInfo[] = [
          {
            comments: [],
            id: 'http://rdfh.ch/lists/0001/otherTreeList',
            isRootNode: true,
            labels: [
              {
                language: 'en',
                value: 'Tree list root',
              },
            ],
            projectIri: 'http://rdfh.ch/projects/0001',
          },
          {
            comments: [
              {
                language: 'en',
                value: 'a list that is not in used in ontology or data',
              },
            ],
            id: 'http://rdfh.ch/lists/0001/notUsedList',
            isRootNode: true,
            labels: [
              {
                language: 'de',
                value: 'unbenutzte Liste',
              },
              {
                language: 'en',
                value: 'a list that is not used',
              },
            ],
            name: 'notUsedList',
            projectIri: 'http://rdfh.ch/projects/0001',
          },
          {
            comments: [
              {
                language: 'en',
                value: 'Anything Tree List',
              },
            ],
            id: 'http://rdfh.ch/lists/0001/treeList',
            isRootNode: true,
            labels: [
              {
                language: 'de',
                value: 'Listenwurzel',
              },
              {
                language: 'en',
                value: 'Tree list root',
              },
            ],
            name: 'treelistroot',
            projectIri: 'http://rdfh.ch/projects/0001',
          },
        ];
        return of(response);
      });

    // can delete ontology request
    const dspConnSpy = TestBed.inject(DspApiConnectionToken);
    (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).canDeleteOntology.and.callFake(() => {
      const deleteResClass: CanDoResponse = {
        canDo: false,
      };

      return of(deleteResClass);
    });

    (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).getOntologiesByProjectIri.and.callFake(() => {
      const response: OntologiesMetadata = MockOntology.mockOntologiesMetadata();
      return of(response);
    });

    (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).getOntology.and.callFake(() => {
      const response: ReadOntology = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
      return of(response);
    });

    (dspConnSpy.admin.listsEndpoint as jasmine.SpyObj<ListsEndpointAdmin>).getListsInProject.and.callFake(() => {
      const response = new ListsResponse();

      response.lists = new Array<ListNodeInfo>();

      const mockList1 = new ListNodeInfo();
      mockList1.comments = [];
      mockList1.id = 'http://rdfh.ch/lists/0001/mockList01';
      mockList1.isRootNode = true;
      mockList1.labels = [{ language: 'en', value: 'Mock List 01' }];
      mockList1.projectIri = 'http://rdfh.ch/projects/myProjectIri';

      const mockList2 = new ListNodeInfo();
      mockList2.comments = [];
      mockList2.id = 'http://rdfh.ch/lists/0001/mockList02';
      mockList2.isRootNode = true;
      mockList2.labels = [{ language: 'en', value: 'Mock List 02' }];
      mockList2.projectIri = 'http://rdfh.ch/projects/myProjectIri';

      response.lists.push(mockList1, mockList2);

      return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
    });

    (dspConnSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>).getUserByUsername.and.callFake(() => {
      const loggedInUser = MockUsers.mockUser();
      return of(loggedInUser);
    });

    // mock projects endpoint
    (dspConnSpy.admin.projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>).getProjectByIri.and.callFake(() => {
      const response = new ProjectResponse();

      const mockProjects = MockProjects.mockProjects();

      response.project = mockProjects.body.projects[0];

      return of(ApiResponseData.fromAjaxResponse({ response } as AjaxResponse));
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect<any>(localStorage.getItem('session')).toBe(JSON.stringify(TestConfig.CurrentSession));
    expect(component).toBeTruthy();
  });
});
