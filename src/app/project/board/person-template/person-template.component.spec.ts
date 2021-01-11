import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonTemplateComponent } from './person-template.component';
import { Component, ViewChild } from '@angular/core';


/**
 * Test host component to simulate parent component.
 */
@Component({
    selector: 'app-contact-host-component',
    template: '<app-person-template [person]="contactDetails"></app-person-template>'
})
class TestHostContactComponent {

    @ViewChild('personView') personView: PersonTemplateComponent;

    // input parameters
    contactDetails = {
        'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
        'email': 'stewart.abraham@test.ch',
        'familyName': 'Abraham',
        'givenName': 'Stewart',
        'jobTitle': 'Dr.',
        'memberOf': 'http://ns.dasch.swiss/test-dasch',
        'sameAs': 'https://orcid.org/0000-0002-1825-0097'
    };
}

describe('PersonTemplateComponent', () => {
    let testHostComponent: TestHostContactComponent;
    let testHostFixture: ComponentFixture<TestHostContactComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestHostContactComponent,
                PersonTemplateComponent
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostContactComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    });
});
