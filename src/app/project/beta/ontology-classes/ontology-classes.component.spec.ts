import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClassDefinition } from '@dasch-swiss/dsp-js';
import { OntologyClassesComponent } from './ontology-classes.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'test-host-component',
    template: `
        <app-ontology-classess #ontoClasses
            [resClass]="resClass">
        </app-ontology-classess>
    `
})
class TestHostComponent {

    @ViewChild('ontoClasses') ontoClasses: OntologyClassesComponent;

    resClasses: ClassDefinition[] = [{
        'id': 'http://0.0.0.0:3333/ontology/0001/something/v2#Something',
        'subClassOf': ['http://0.0.0.0:3333/ontology/0001/anything/v2#Thing'],
        'comment': 'A something is a thing.',
        'label': 'Something',
        'propertiesList': [{
            'propertyIndex': 'http://api.knora.org/ontology/knora-api/v2#arkUrl',
            'cardinality': 0,
            'isInherited': true
        }, {
            'propertyIndex': 'http://api.knora.org/ontology/knora-api/v2#attachedToProject',
            'cardinality': 0,
            'isInherited': true
        }]
    }];
}

describe('OntologyClassesComponent', () => {

    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;
    let ontoClassItemComponentDe;
    let hostCompDe;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ OntologyClassesComponent ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        hostCompDe = testHostFixture.debugElement;
        ontoClassItemComponentDe = hostCompDe.query(By.directive(OntologyClassesComponent));
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.ontoClasses).toBeTruthy();
    });
});
