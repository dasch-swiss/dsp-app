import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DatasetTabViewComponent } from './dataset-tab-view.component';
import { Component, ViewChild } from '@angular/core';


/**
 * Test host component to simulate parent component.
 */
@Component({
    selector: 'app-board-host-component',
    template: '<app-dataset-tab-view [metadata]="datasetMetadata"></app-dataset-tab-view>'
})
class TestHostBoardComponent {

    @ViewChild('datasetTabView') datasetTabView: DatasetTabViewComponent;

    // metadata object
    datasetMetadata = {
        'abstract': 'Dies ist ein Testprojekt.',
        'alternativeTitle': 'test',
        'conditionsOfAccess': 'Open Access',
        'dateCreated': '2001-09-26',
        'dateModified': '2020-04-26',
        'datePublished': '2002-09-24',
        'distribution': {'type': 'https://schema.org/DataDownload', 'value': 'https://test.dasch.swiss'},
        'documentation': 'Work in progress',
        'howToCite': 'Testprojekt (test), 2002, https://test.dasch.swiss',
        'language': ['EN', 'DE', 'FR'],
        'license': {'type': 'https://schema.org/URL', 'value': 'https://creativecommons.org/licenses/by/3.0'},
        'qualifiedAttribution': [{'role': 'contributor', 'agent': 'http://ns.dasch.swiss/test-berry'}, {'role': 'contributor', 'agent': 'http://ns.dasch.swiss/test-hart'}, {
            'role': 'editor',
            'agent': 'http://ns.dasch.swiss/test-abraham'
        }, {'role': 'editor', 'agent': 'http://ns.dasch.swiss/test-coleman'}, {'role': 'editor', 'agent': 'http://ns.dasch.swiss/test-jones'}],
        'status': 'ongoing',
        'title': 'Testprojekt',
        'typeOfData': ['image', 'text'],
        'project': {
            'alternateName': 'test',
            'contactPoint': {
                'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
                'email': 'stewart.abraham@test.ch',
                'familyName': 'Abraham',
                'givenName': 'Stewart',
                'jobTitle': 'Dr.',
                'memberOf': 'http://ns.dasch.swiss/test-dasch',
                'sameAs': {'type': 'https://schema.org/URL', 'value': 'https://orcid.org/0000-0002-1825-0097'},
                'organisation':  {
                    'address': {'addressLocality': 'Toronto', 'postalCode': '40000', 'streetAddress': 'University of Toronto Street'},
                    'email': '/info@universityoftoronto.ca',
                    'name': 'University of Toronto',
                    'url': {'type': 'https://schema.org/URL', 'value': 'http://www.utoronto.ca/'}
                }
            },
            'dataManagementPlan': {'url': {'type': 'https://schema.org/URL', 'value': 'https://snf.ch'}, 'isAvailable': false},
            'description': 'Dies ist ein Testprojekt...alle Properties wurden verwendet, um diese zu testen',
            'discipline': {'name': 'SKOS UNESCO Nomenclature', 'url': 'http://skos.um.es/unesco6/11'},
            'endDate': '2001-01-26',
            'funder': 'http://ns.dasch.swiss/test-funder',
            'grant': {
                'funder': [
                    {
                        'address': {'addressLocality': 'Toronto', 'postalCode': '40000', 'streetAddress': 'University of Toronto Street'},
                        'email': '/info@universityoftoronto.ca',
                        'name': 'University of Toronto',
                        'url': {'type': 'https://schema.org/URL', 'value': 'http://www.utoronto.ca/'}
                    },
                    {
                        'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
                        'email': 'lauren.berry@unibas.ch',
                        'familyName': 'Berry',
                        'givenName': 'Lauren',
                        'jobTitle': 'Dr.',
                        'organisation':  {
                            'address': {'addressLocality': 'Toronto', 'postalCode': '40000', 'streetAddress': 'University of Toronto Street'},
                            'email': 'info@universityoftoronto.ca',
                            'name': 'University of Toronto',
                            'url': 'http://www.utoronto.ca/'
                        }
                    }], 'name': 'Test Grant Name', 'number': '0123456789', 'url': {'type': 'https://schema.org/URL', 'value': 'http://p3.snf.ch/testproject'}
            },
            'keywords': ['science', 'mathematics', 'history of science', 'history of mathematics'],
            'name': 'Testprojektname (test)',
            'publication': 'testpublication',
            'shortcode': '0000',
            'spatialCoverage': [
                {'place': {'name': 'Geonames', 'url': 'https://www.geonames.org/2017370/russian-federation.html'}}, {
                    'place': {
                        'name': 'Geonames',
                        'url': 'https://www.geonames.org/2658434/switzerland.html'
                    }
                }, {'place': {'name': 'Geonames', 'url': 'https://www.geonames.org/3175395/italian-republic.html'}}, {
                    'place': {
                        'name': 'Geonames',
                        'url': 'https://www.geonames.org/2921044/federal-republic-of-germany.html'
                    }
                }, {'place': {'name': 'Geonames', 'url': 'https://www.geonames.org/3017382/republic-of-france.html'}}, {
                    'place': {
                        'name': 'Geonames',
                        'url': 'https://www.geonames.org/6269131/england.html'
                    }
                }, {'place': {'name': 'Geonames', 'url': 'https://www.geonames.org/6255148/europe.html'}}],
            'startDate': '2000-07-26',
            'temporalCoverage': {'name': 'Chronontology Dainst', 'url': 'http://chronontology.dainst.org/period/Ef9SyESSafJ1'},
            'url': {'type': 'https://schema.org/URL', 'value': 'https://test.dasch.swiss/'}
        },
        'sameAs': {'type': 'https://schema.org/URL', 'value': 'https://test.dasch.swiss/'}
    };
}

describe('DatasetTabViewComponent', () => {
    let testHostComponent: TestHostBoardComponent;
    let testHostFixture: ComponentFixture<TestHostBoardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestHostBoardComponent,
                DatasetTabViewComponent
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
