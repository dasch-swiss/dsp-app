import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonTemplateComponent } from './person-template.component';
import { Component, ViewChild } from '@angular/core';
import { AddressTemplateComponent } from '../address-template/address-template.component';


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
        'email': ['stewart.abraham@test.ch'],
        'familyName': 'Abraham',
        'givenName': 'Stewart',
        'jobTitle': ['Dr.'],
        'id': 'http://ns.dasch.swiss/repository#test-berry',
        'memberOf': [
            {
                'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
                'email': 'info@dasch.swiss',
                'id': 'http://ns.dasch.swiss/repository#test-dasch',
                'name': ['TEST'],
                'type': 'http://ns.dasch.swiss/repository#Organization',
                'url': [{'type': 'https://schema.org/URL', 'url': 'https://test.swiss'}]
            }
        ],
        'sameAs': [{'type': 'https://schema.org/URL', 'value': 'https://orcid.org/0000-0002-1825-0097', 'url': 'https://orcid.org/0000-0002-1825-0097'}]
    };
}

describe('PersonTemplateComponent', () => {
    let testHostComponent: TestHostContactComponent;
    let testHostFixture: ComponentFixture<TestHostContactComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestHostContactComponent,
                AddressTemplateComponent,
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

    // todo: add test case when test data is ready
    /* it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    }); */
});
