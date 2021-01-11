import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-attribution-tab-view',
    templateUrl: './attribution-tab-view.component.html',
    styleUrls: ['./attribution-tab-view.component.scss']
})
export class AttributionTabViewComponent implements OnInit{

    // attribution input
    @Input() attribution: object;

    // hard-coded data to complete the functionality
    people = [{
        'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
        'email': 'benjamin.jones@test.ch',
        'familyName': 'Jones',
        'givenName': 'Benjamin',
        'jobTitle': 'Dr. des.',
        'organisation':  {
            'address': {'addressLocality': 'Toronto', 'postalCode': '40000', 'streetAddress': 'University of Toronto Street'},
            'email': 'info@universityoftoronto.ca',
            'name': 'University of Toronto',
            'url': 'http://www.utoronto.ca/'
        }
    }, {
        'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
        'email': 'james.coleman@dasch.swiss',
        'familyName': 'Coleman',
        'givenName': 'James',
        'jobTitle': 'Dr. des.',
        'organisation':  {
            'address': {'addressLocality': 'Toronto', 'postalCode': '40000', 'streetAddress': 'University of Toronto Street'},
            'email': 'info@universityoftoronto.ca',
            'name': 'University of Toronto',
        }
    }, {
        'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
        'email': 'lauren.berry@unibas.ch',
        'familyName': 'Berry',
        'givenName': 'Lauren',
        'jobTitle': 'Dr.',
        'organisation':  {
            'address': {'addressLocality': 'Toronto', 'postalCode': '40000', 'streetAddress': 'University of Toronto Street'},
            'email': 'info@universityoftoronto.ca',
            'name': 'University of Toronto',
        }
    }, {
        'address': {'addressLocality': 'Basel', 'postalCode': '4000', 'streetAddress': 'Teststrasse'},
        'email': 'leonhard.hart@test.ch',
        'familyName': 'Hart',
        'givenName': 'Leonhard',
        'jobTitle': 'Prof.',
        'organisation':  {
            'address': {'addressLocality': 'Toronto', 'postalCode': '40000', 'streetAddress': 'University of Toronto Street'},
            'email': 'info@universityoftoronto.ca',
            'name': 'University of Toronto',
        }
    },{
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
    }];

    ngOnInit(): void {
        // reformat data
        for (let idx = 0; idx < this.people.length; idx++) {
            if (this.people[idx]['sameAs']) {
                this.people[idx]['sameAs'] = this.people[idx]['sameAs']['value'];
            }
        }
    }

}
