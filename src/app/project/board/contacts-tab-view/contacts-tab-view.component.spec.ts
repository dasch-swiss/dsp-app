import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactsTabViewComponent } from './contacts-tab-view.component';
import { Component, ViewChild } from '@angular/core';
import { PersonTemplateComponent } from '../person-template/person-template.component';
import { AddressTemplateComponent } from '../address-template/address-template.component';

/**
 * Test host component to simulate parent component.
 */
@Component({
    selector: 'app-board-host-component',
    template: '<app-contacts-tab-view [contactDetails]="contactDetails"></app-contacts-tab-view>'
})
class TestHostBoardComponent {

    @ViewChild('contactsTabView') contactsTabView: ContactsTabViewComponent;

    // input parameters
    contactDetails = {
        'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
        'email': 'stewart.abraham@test.ch',
        'familyName': 'Abraham',
        'givenName': 'Stewart',
        'jobTitle': 'Dr.',
        'memberOf': 'http://ns.dasch.swiss/test-dasch',
        'sameAs': {'type': 'https://schema.org/URL', 'value': 'https://orcid.org/0000-0002-1825-0097'}
    };
}

describe('ContactsTabViewComponent', () => {
    let testHostComponent: TestHostBoardComponent;
    let testHostFixture: ComponentFixture<TestHostBoardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestHostBoardComponent,
                AddressTemplateComponent,
                ContactsTabViewComponent,
                PersonTemplateComponent
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostBoardComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();
    });

    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
    });
});
