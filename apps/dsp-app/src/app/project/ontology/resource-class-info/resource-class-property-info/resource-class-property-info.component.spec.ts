import { OverlayContainer } from '@angular/cdk/overlay';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, DebugElement, Input, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  CanDoResponse,
  Constants,
  IHasProperty,
  ListNodeInfo,
  MockOntology,
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
import { ResourceClassPropertyInfoComponent } from '@dsp-app/src/app/project/ontology/resource-class-info/resource-class-property-info/resource-class-property-info.component';
import { TestConfig } from '@dsp-app/src/test.config';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

/**
 * test host component to simulate parent component
 * Property is of type simple text
 */
@Component({
  template:
    '<app-resource-class-property-info #propertyInfo [propCard]="propertyCardinality" [propDef]="propertyDefinition"></app-resource-class-property-info>',
})
class SimpleTextHostComponent {
  @ViewChild('propertyInfo')
  propertyInfoComponent: ResourceClassPropertyInfoComponent;

  propertyCardinality: IHasProperty = {
    propertyIndex: 'http://0.0.0.0:3333/ontology/1111/Notizblogg/v2#notgkygty',
    cardinality: 0,
    guiOrder: 1,
    isInherited: false,
  };
  propertyDefinition: ResourcePropertyDefinitionWithAllLanguages = {
    id: 'http://0.0.0.0:3333/ontology/1111/Notizblogg/v2#notgkygty',
    subPropertyOf: ['http://api.knora.org/ontology/knora-api/v2#hasValue'],
    comment: 'Beschreibt einen Namen',
    label: 'Name',
    guiElement: 'http://api.knora.org/ontology/salsah-gui/v2#SimpleText',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkProperty: false,
    isLinkValueProperty: false,
    isEditable: true,
    guiAttributes: [],
    comments: [
      {
        language: 'de',
        value: 'Beschreibt einen Namen',
      },
    ],
    labels: [
      {
        language: 'de',
        value: 'Name',
      },
    ],
  };
}

/**
 * test host component to simulate parent component
 * Property is of type resource link
 */
@Component({
  template:
    '<app-resource-class-property-info #propertyInfo [propCard]="propertyCardinality" [propDef]="propertyDefinition"></app-resource-class-property-info>',
})
class LinkHostComponent {
  @ViewChild('propertyInfo')
  propertyInfoComponent: ResourceClassPropertyInfoComponent;

  propertyCardinality: IHasProperty = {
    propertyIndex: 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing',
    cardinality: 2,
    guiOrder: 1,
    isInherited: false,
  };
  propertyDefinition: ResourcePropertyDefinitionWithAllLanguages = {
    id: 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing',
    subPropertyOf: ['http://api.knora.org/ontology/knora-api/v2#hasLinkTo'],
    label: 'Ein anderes Ding',
    guiElement: 'http://api.knora.org/ontology/salsah-gui/v2#Searchbox',
    subjectType: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
    objectType: 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing',
    isLinkProperty: true,
    isLinkValueProperty: false,
    isEditable: true,
    guiAttributes: [],
    comments: [],
    labels: [
      {
        language: 'de',
        value: 'Ein anderes Ding',
      },
      {
        language: 'en',
        value: 'Another thing',
      },
      {
        language: 'fr',
        value: 'Une autre chose',
      },
      {
        language: 'it',
        value: 'Un altra cosa',
      },
    ],
  };
}

@Component({
  selector: 'ngx-skeleton-loader',
  template: '',
})
class MockNgxSkeletonLoaderComponent {
  @Input() theme: string;
  // Add any other necessary input properties here
}

/**
 * test host component to simulate parent component
 * Property is of type list dropdown
 */
@Component({
  template:
    '<app-resource-class-property-info #propertyInfo [propCard]="propertyCardinality" [propDef]="propertyDefinition"></app-resource-class-property-info>',
})
class ListHostComponent {
  @ViewChild('propertyInfo')
  propertyInfoComponent: ResourceClassPropertyInfoComponent;

  propertyCardinality: IHasProperty = {
    propertyIndex: 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem',
    cardinality: 2,
    guiOrder: 0,
    isInherited: true,
  };
  propertyDefinition: ResourcePropertyDefinitionWithAllLanguages = {
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
}

describe('ResourceClassPropertyInfoComponent', () => {
  let simpleTextHostComponent: SimpleTextHostComponent;
  let simpleTextHostFixture: ComponentFixture<SimpleTextHostComponent>;

  let linkHostComponent: LinkHostComponent;
  let linkHostFixture: ComponentFixture<LinkHostComponent>;

  let listHostComponent: ListHostComponent;
  let listHostFixture: ComponentFixture<ListHostComponent>;

  let rootLoader: HarnessLoader;
  let overlayContainer: OverlayContainer;

  beforeEach(waitForAsync(() => {
    const applicationStateServiceSpy = jasmine.createSpyObj('ApplicationStateService', ['get']);

    const ontologyEndpointSpyObj = {
      v2: {
        onto: jasmine.createSpyObj('onto', ['canDeleteResourceProperty']),
      },
    };

    TestBed.configureTestingModule({
      declarations: [
        DialogComponent,
        DialogHeaderComponent,
        LinkHostComponent,
        ListHostComponent,
        SimpleTextHostComponent,
        SplitPipe,
        ResourceClassPropertyInfoComponent,
        MockNgxSkeletonLoaderComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatSlideToggleModule,
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
  }));

  beforeEach(() => {
    const dspConnSpy = TestBed.inject(DspApiConnectionToken);
    (dspConnSpy.v2.onto as jasmine.SpyObj<OntologiesEndpointV2>).canDeleteResourceProperty.and.callFake(() => {
      const deleteResProp: CanDoResponse = {
        canDo: false,
      };

      return of(deleteResProp);
    });
  });

  beforeEach(() => {
    // mock application state service for currentOntology
    const applicationStateServiceSpy = TestBed.inject(ApplicationStateService);

    (applicationStateServiceSpy as jasmine.SpyObj<ApplicationStateService>).get.and.callFake(() => {
      const response: ReadOntology = MockOntology.mockReadOntology('http://0.0.0.0:3333/ontology/0001/anything/v2');
      return of(response);
    });

    simpleTextHostFixture = TestBed.createComponent(SimpleTextHostComponent);
    simpleTextHostComponent = simpleTextHostFixture.componentInstance;
    simpleTextHostFixture.detectChanges();

    expect(simpleTextHostComponent).toBeTruthy();

    overlayContainer = TestBed.inject(OverlayContainer);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(simpleTextHostFixture);

    linkHostFixture = TestBed.createComponent(LinkHostComponent);
    linkHostComponent = linkHostFixture.componentInstance;
    linkHostFixture.detectChanges();

    expect(linkHostComponent).toBeTruthy();
  });

  beforeEach(() => {
    // mock application state service for currentOntologyLists
    const applicationStateServiceSpy = TestBed.inject(ApplicationStateService);

    (applicationStateServiceSpy as jasmine.SpyObj<ApplicationStateService>).get.and.callFake(() => {
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
    listHostFixture = TestBed.createComponent(ListHostComponent);
    listHostComponent = listHostFixture.componentInstance;
    listHostFixture.detectChanges();

    expect(listHostComponent).toBeTruthy();
  });

  afterEach(async () => {
    const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
    await Promise.all(dialogs.map(async d => await d.close()));

    // angular won't call this for us so we need to do it ourselves to avoid leaks.
    overlayContainer.ngOnDestroy();
  });

  it('should create an instance', () => {
    expect(simpleTextHostComponent.propertyInfoComponent).toBeTruthy();
  });

  it('expect cardinality 0 = only one but required value (1)', () => {
    expect(simpleTextHostComponent.propertyInfoComponent).toBeTruthy();
    expect(simpleTextHostComponent.propertyInfoComponent.propCard).toBeDefined();
    expect(simpleTextHostComponent.propertyInfoComponent.propCard.cardinality).toBe(0);

    const hostCompDe = simpleTextHostFixture.debugElement;

    const multipleToggle: DebugElement = hostCompDe.query(By.css('mat-slide-toggle[data-name="multiple"]'));
    const requiredToggle: DebugElement = hostCompDe.query(By.css('mat-slide-toggle[data-name="required"]'));

    function isChecked(toggle: DebugElement): boolean {
      return toggle.nativeElement.getAttribute('ng-reflect-checked') === 'true';
    }

    // cardinality 0 means 'no multiple values'
    expect(isChecked(multipleToggle)).toEqual(false);
    // and cardinality 0 means also 'required value'
    expect(isChecked(requiredToggle)).toEqual(true);
  });

  it('expect property type "text" and gui element "simple input"', () => {
    expect(simpleTextHostComponent.propertyInfoComponent).toBeTruthy();
    expect(simpleTextHostComponent.propertyInfoComponent.propDef).toBeDefined();
    expect(simpleTextHostComponent.propertyInfoComponent.propDef.guiElement).toBe(
      Constants.SalsahGui + Constants.HashDelimiter + 'SimpleText'
    );

    const hostCompDe = simpleTextHostFixture.debugElement;

    const typeIcon: DebugElement = hostCompDe.query(By.css('.type'));

    // property type and gui element should be Text: simple Text
    expect(typeIcon.nativeElement.innerText).toEqual('short_text');
  });

  it('expect property type "link" and gui element "search box"', () => {
    expect(linkHostComponent.propertyInfoComponent).toBeTruthy();
    expect(linkHostComponent.propertyInfoComponent.propDef).toBeDefined();
    expect(linkHostComponent.propertyInfoComponent.propDef.guiElement).toBe(
      Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox'
    );

    const hostCompDe = linkHostFixture.debugElement;

    const typeIcon: DebugElement = hostCompDe.query(By.css('.type'));

    // expect 'link' icon
    expect(typeIcon.nativeElement.innerText).toEqual('link');
  });

  it('expect link to other resource called "Thing"', () => {
    expect(linkHostComponent.propertyInfoComponent).toBeTruthy();
    expect(linkHostComponent.propertyInfoComponent.propDef).toBeDefined();

    const hostCompDe = linkHostFixture.debugElement;

    const attribute: DebugElement = hostCompDe.query(By.css('.attribute'));
    // expect linked resource called 'Thing'
    expect(attribute.nativeElement.innerText).toContain('Thing');
  });

  it('expect cardinality 2 = not required but multiple values (0-n)', () => {
    expect(linkHostComponent.propertyInfoComponent).toBeTruthy();
    expect(linkHostComponent.propertyInfoComponent.propDef).toBeDefined();

    const hostCompDe = linkHostFixture.debugElement;

    expect(hostCompDe).toBeTruthy();

    const multipleToggle: DebugElement = hostCompDe.query(By.css('mat-slide-toggle[data-name="multiple"]'));
    const requiredToggle: DebugElement = hostCompDe.query(By.css('mat-slide-toggle[data-name="required"]'));

    function isChecked(toggle: DebugElement): boolean {
      return toggle.nativeElement.getAttribute('ng-reflect-checked') === 'true';
    }
    // cardinality 2 means 'multiple values'
    expect(isChecked(multipleToggle)).toEqual(true);
    // and cardinality 2 means also 'not required value'
    expect(isChecked(requiredToggle)).toEqual(false);
  });

  it('expect list property with connection to list "Listenwurzel"', () => {
    expect(listHostComponent.propertyInfoComponent).toBeTruthy();
    expect(listHostComponent.propertyInfoComponent.propDef).toBeDefined();

    const hostCompDe = listHostFixture.debugElement;

    const attribute: DebugElement = hostCompDe.query(By.css('.attribute'));
    // expect list called "Listenwurzel"
    expect(attribute.nativeElement.innerText).toContain('Listenwurzel');
  });
});
