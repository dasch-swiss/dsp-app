import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  CanDoResponse,
  ListNodeInfo,
  OntologiesEndpointV2,
  ReadOntology,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConfigToken, DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppLoggingService } from '@dasch-swiss/vre/shared/app-logging';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DialogHeaderComponent } from '@dsp-app/src/app/main/dialog/dialog-header/dialog-header.component';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { SplitPipe } from '@dsp-app/src/app/main/pipes/split.pipe';
import { StringifyStringLiteralPipe } from '@dsp-app/src/app/main/pipes/string-transformation/stringify-string-literal.pipe';
import { TestConfig } from '@dsp-app/src/test.config';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { PropertyFormComponent } from '../property-form/property-form.component';
import { PropertyInfoComponent } from './property-info.component';

// mock property definition
const mockPropertyDefinition: ResourcePropertyDefinitionWithAllLanguages = {
  id: 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem',
  subPropertyOf: ['http://api.knora.org/ontology/knora-api/v2#hasValue'],
  label: 'Listenelement',
  guiElement: 'http://api.knora.org/ontology/salsah-gui/v2#List',
  subjectType: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
  objectType: 'http://api.knora.org/ontology/knora-api/v2#ListValue',
  isLinkProperty: false,
  isLinkValueProperty: false,
  isEditable: true,
  guiAttributes: ['hlist=<http://rdfh.ch/lists/0001/treeList>'],
  comments: [],
  labels: [
    {
      language: 'de',
      value: 'Listenelement',
    },
    {
      language: 'en',
      value: 'List element',
    },
    {
      language: 'fr',
      value: 'Elément de liste',
    },
    {
      language: 'it',
      value: 'Elemento di lista',
    },
  ],
};

const mockOntologyResponse = [
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

describe('Property info component', () => {
  let component: PropertyInfoComponent;
  let fixture: ComponentFixture<PropertyInfoComponent>;

  beforeEach(async () => {
    const applicationStateServiceSpy = jasmine.createSpyObj('ApplicationStateService', ['get']);

    const ontologyEndpointSpyObj = {
      v2: {
        onto: jasmine.createSpyObj('onto', ['canDeleteResourceProperty', 'getAllClassDefinitions']),
      },
    };

    await TestBed.configureTestingModule({
      declarations: [
        DialogComponent,
        DialogHeaderComponent,
        PropertyFormComponent,
        PropertyInfoComponent,
        SplitPipe,
        StringifyStringLiteralPipe,
      ],
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatSnackBarModule,
        MatTooltipModule,
      ],
      providers: [
        AppConfigService,
        MockProvider(AppLoggingService),
        {
          provide: DspApiConfigToken,
          useValue: TestConfig.ApiConfig,
        },
        {
          provide: DspApiConnectionToken,
          useValue: ontologyEndpointSpyObj,
        },
        {
          provide: ApplicationStateService,
          useValue: applicationStateServiceSpy,
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
        {
          provide: MatDialogRef,
          useValue: {},
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    // mock application state service get requests
    const applicationStateServiceSpy = TestBed.inject(ApplicationStateService);

    (applicationStateServiceSpy as jasmine.SpyObj<ApplicationStateService>).get.and.callFake((key: string) => {
      if (key === 'currentOntologyLists') {
        const response: ListNodeInfo[] = mockOntologyResponse;
        return of(response);
      } else if (key === 'currentProjectOntologies') {
        const response: ReadOntology[] = [];
        return of(response);
      } else if (key === 'currentOntology') {
        const response: ReadOntology = undefined;
        return of(response);
      } else {
        // Handle any other keys as needed
        return of(null);
      }
    });

    const dspConnSpy = TestBed.inject(DspApiConnectionToken);
    (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).canDeleteResourceProperty.and.callFake(() => {
      const deleteResProp: CanDoResponse = {
        canDo: false,
      };

      return of(deleteResProp);
    });

    fixture = TestBed.createComponent(PropertyInfoComponent);
    component = fixture.componentInstance;
    component.propDef = mockPropertyDefinition; // setting mock input

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });
});
