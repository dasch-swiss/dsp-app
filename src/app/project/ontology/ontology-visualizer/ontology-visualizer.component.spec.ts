import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { RouterTestingModule } from '@angular/router/testing';
import {
    IHasProperty,
    KnoraApiConnection,
    ReadOntology,
    ResourceClassDefinition,
    ResourcePropertyDefinition
} from '@dasch-swiss/dsp-js';
import {
    AppInitService,
    DspActionModule,
    DspApiConfigToken,
    DspApiConnectionToken,
    DspCoreModule
} from '@dasch-swiss/dsp-ui';
import { ErrorComponent } from 'src/app/main/error/error.component';
import { TestConfig } from 'test.config';
import { OntologyVisualizerComponent } from './ontology-visualizer.component';
import { VisualizerComponent } from './visualizer/visualizer.component';

describe('OntologyVisualizerComponent', () => {
    let testHostComponent: OntologyVisualizerComponent;
    let testHostFixture: ComponentFixture<OntologyVisualizerComponent>;
    // test ontology
    const testOntology = new ReadOntology();
    testOntology.id = 'http://www.knora.org/ontology/0000/testontology';
    // a test resource class
    const testResourceClass1 = new ResourceClassDefinition();
    testResourceClass1.id = 'http://www.knora.org/ontology/0000/testontology/v2#testResource1';
    testResourceClass1.canBeInstantiated  = true;
    testResourceClass1.comment = 'first test resource class';
    testResourceClass1.label = 'Test Resource 1';
    testResourceClass1.propertiesList = [];
    testResourceClass1.subClassOf = ['http://api.knora.org/ontology/knora-api/v2#Resource', 'http://purl.org/ontology/bibo/testResource'];

    const textValueProperty: IHasProperty = {
        propertyIndex: 'http://www.knora.org/ontology/0000/testontology/v2#hasText',
        guiOrder: 1,
        isInherited: false,
        cardinality: 1
    };
    testResourceClass1.propertiesList.push(textValueProperty);
    const textValuePropertyDefinition = new ResourcePropertyDefinition();
    textValuePropertyDefinition.objectType = 'http://api.knora.org/ontology/knora-api/v2#TextValue';
    textValuePropertyDefinition.label = 'testText';
    textValuePropertyDefinition.id = 'http://www.knora.org/ontology/0000/testontology/v2#hasText';
    textValuePropertyDefinition.subjectType = 'http://www.knora.org/ontology/0000/testontology/v2#testResource1';
    testOntology.properties['http://www.knora.org/ontology/0000/testontology/v2#hasText'] = textValuePropertyDefinition;

    const circularValueProperty: IHasProperty = {
        propertyIndex: 'http://www.knora.org/ontology/0000/testontology/v2#hasCopy',
        guiOrder: 1,
        isInherited: false,
        cardinality: 1
    };
    testResourceClass1.propertiesList.push(circularValueProperty);
    const circularValuePropertyDefinition = new ResourcePropertyDefinition();
    circularValuePropertyDefinition.objectType = 'http://www.knora.org/ontology/0000/testontology/v2#testResource1';
    circularValuePropertyDefinition.label = 'textHasCopy';
    circularValuePropertyDefinition.id = 'http://www.knora.org/ontology/0000/testontology/v2#hasCopy';
    circularValuePropertyDefinition.subjectType = 'http://www.knora.org/ontology/0000/testontology/v2#testResource1';
    testOntology.properties['http://www.knora.org/ontology/0000/testontology/v2#hasCopy'] = circularValuePropertyDefinition;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                OntologyVisualizerComponent,
                VisualizerComponent,
                ErrorComponent
            ],
            imports: [
                HttpClientTestingModule,
                DspActionModule,
                DspCoreModule,
                MatRadioModule,
                MatSliderModule,
                MatSlideToggleModule,
                RouterTestingModule
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        })
            .compileComponents();
    }));
    beforeEach(() => {
        testHostFixture = TestBed.createComponent(OntologyVisualizerComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostComponent.ontoClasses = [testResourceClass1];
        testHostComponent.ontology = testOntology;
        testHostFixture.detectChanges();
    });
    it(`should check the component input (ontology and ontoClasses)`, async( () => {
        expect(testHostComponent.ontoClasses.length).toEqual(1);
        expect(testHostComponent.ontoClasses[0].propertiesList.length).toEqual(2);
        expect(testHostComponent.ontology.id).toMatch('http://www.knora.org/ontology/0000/testontology');
    }));
    it(`should get ontology prefix, resource label, and combination of both from class IRI`, async( () => {
       const resLabelInfo = testHostComponent.createLabelFromIRI('http://www.knora.org/ontology/0000/testontology/v2#testResource1');
       expect(resLabelInfo.ontoName).toEqual('testontology');
       expect(resLabelInfo.type).toEqual('testResource1');
       expect(resLabelInfo.newLabel).toEqual(resLabelInfo.ontoName + ':' + resLabelInfo.type);
    }));
    it(`should convert resource classes defined in ontology to nodes`, async( () => {
        expect(testHostComponent.nodes.length).toEqual(4);
        const nodeForTestResource1 = testHostComponent.nodes[0];
        expect(nodeForTestResource1['id']).toEqual('http://www.knora.org/ontology/0000/testontology/v2#testResource1');
        expect(nodeForTestResource1['label']).toEqual('testontology:testResource1');
        expect(nodeForTestResource1['class']).toEqual('native');
        expect(nodeForTestResource1['group']).toEqual('resource');
    }));
    it(`should convert super classes defined for resources to nodes as external resource`, async( () => {
        const nodeForKnoraResource = {
            'id': 'http://api.knora.org/ontology/knora-api/v2#Resource',
            'label': 'knora-api:Resource',
            'group': 'resource',
            'class': 'external'
        };
        expect(testHostComponent.nodes).toContain(nodeForKnoraResource);
        const nodeForbiboResource = {
            'id': 'http://purl.org/ontology/bibo/testResource',
            'label': 'http://purl.org/ontology/bibo/testResource',
            'group': 'resource',
            'class': 'external'
        };
        expect(testHostComponent.nodes).toContain(nodeForbiboResource);
    }));
    it(`should check if a resource class is in nodes list with its IRI`, async( () => {
        expect(testHostComponent.isInNodes('http://www.knora.org/ontology/0000/testontology/v2#testResource1')).toBeTruthy();

    }));
    it(`should create links defining subclass relations`, async( () => {
        expect(testHostComponent.links.length).toEqual(4);
        const subClassofKnoraAPiResource = {
            'source': 'http://www.knora.org/ontology/0000/testontology/v2#testResource1',
            'target': 'http://api.knora.org/ontology/knora-api/v2#Resource',
            'label': 'subClassOf',
            'rotation': 0,
            'curvature': 0
        };
        const subClassofBiboResource = {
            'source': 'http://www.knora.org/ontology/0000/testontology/v2#testResource1',
            'target': 'http://purl.org/ontology/bibo/testResource',
            'label': 'subClassOf',
            'rotation': 0,
            'curvature': 0
        };

        expect(testHostComponent.links).toContain(subClassofBiboResource);
        expect(testHostComponent.links).toContain(subClassofKnoraAPiResource);
    }));
    it(`should convert literal object type to a node`, async( () => {
        const targetnodeID = testHostComponent.addObjectTypeToNodes('http://api.knora.org/ontology/knora-api/v2#TextValue',
            'http://www.knora.org/ontology/0000/testontology/v2#hasText', 'Test Resource 1');
        expect(targetnodeID).toEqual('Test Resource 1_hasText');
        const textValueNode = {
            'id': 'Test Resource 1_hasText',
            'label': 'knora-api:TextValue',
            'group': 'literal',
            'class': 'TextValue'
        };
        expect(testHostComponent.nodes).toContain(textValueNode);
    }));
    it(`should convert property to link`, async( () => {
        const textValueLink = {
            'source': 'http://www.knora.org/ontology/0000/testontology/v2#testResource1',
            'target': 'Test Resource 1_hasText',
            'label': 'testText',
            'rotation': 0,
            'curvature': 0
        };
        expect(testHostComponent.links).toContain(textValueLink);
    }));
    it(`should convert property to a circular link`, async( () => {
        const circularLink = {
            'source': 'http://www.knora.org/ontology/0000/testontology/v2#testResource1',
            'target': 'http://www.knora.org/ontology/0000/testontology/v2#testResource1',
            'label': 'textHasCopy',
            'rotation': 1,
            'curvature': 0.5
        };
        expect(testHostComponent.links).toContain(circularLink);
    }));
});
