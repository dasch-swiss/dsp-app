import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ProjectResponse,
    ReadProject
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, Session, SessionService } from '@dasch-swiss/dsp-ui';
import { ClipboardService } from 'ngx-clipboard';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { CacheService } from '../../main/cache/cache.service';
import { IDataset } from './dataset-metadata';

export interface DatasetRadioOption {
    name: string;
    id: number;
    checked: boolean;
}

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss']
})

export class BoardComponent implements OnInit {

    // loading for progress indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: ReadProject;

    color: string = 'primary';

    // variables to store metadata information
    // metadata received from backend
    metadata: object;

    // list of all datasets
    datasets: IDataset[];

    // metadata displayed on current page is from selected dataset
    selectedDataset: IDataset;

    // list of dataset names to display as radio buttons in right side column
    datasetOptions: DatasetRadioOption[];

    // different metadata download formats
    metadataDownloadFormats = ['JSON-LD', 'XML', 'Triplestore', 'CSV'];

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _titleService: Title,
        private _clipboardService: ClipboardService
    ) {
        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode);
    }

    ngOnInit() {
        this.loading = true;

        // get information about the logged-in user, if one is logged-in
        if (this._session.getSession()) {
            this.session = this._session.getSession();
            // is the logged-in user system admin?
            this.sysAdmin = this.session.user.sysAdmin;

        }

        // get project info from backend
        this.getProject();

        // get project and dataset metadata from backend
        this.getProjectMetadata();
    }

    getProject() {
        // set the cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get project data from cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                // is logged-in user projectAdmin?
                if (this._session.getSession()) {
                    this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);
                }

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        this.loading = false;
    }

    getProjectMetadata() {
        // get project metadata from backend
        // note: for now to complete functionality we have used hard-coded metadata.
        //       in next iteration, it will be replace with ajax request to get
        //       metadata from backend
        this.metadata = {
            'projectsMetadata': [
                {
                    'type': 'http://ns.dasch.swiss/repository#Dataset',
                    'id': 'http://ns.dasch.swiss/test-dataset',
                    'abstract': 'Dies ist ein Testprojekt.',
                    'alternativeTitle': 'test',
                    'conditionsOfAccess': 'Open Access',
                    'dateCreated': '2001-09-26',
                    'dateModified': '2020-04-26',
                    'datePublished': '2002-09-24',
                    'distribution': {
                        'type': 'https://schema.org/DataDownload',
                        'value': 'https://test.dasch.swiss'
                    },
                    'documentation': 'Work in progress',
                    'howToCite': 'Testprojekt (test), 2002, https://test.dasch.swiss',
                    'language': [
                        'EN',
                        'DE',
                        'FR'
                    ],
                    'license': {
                        'type': 'https://schema.org/URL',
                        'value': 'https://creativecommons.org/licenses/by/3.0'
                    },
                    'qualifiedAttribution': [
                        {
                            'type': 'http://www.w3.org/ns/prov#Attribution',
                            'role': 'contributor',
                            'agent': {
                                'type': 'http://ns.dasch.swiss/repository#Person',
                                'id': 'http://ns.dasch.swiss/test-berry',
                                'address': {
                                    'type': 'https://schema.org/PostalAddress',
                                    'addressLocality': 'Basel',
                                    'postalCode': '4000',
                                    'streetAddress': 'Teststrasse'
                                },
                                'email': 'lauren.berry@unibas.ch',
                                'familyName': 'Berry',
                                'givenName': 'Lauren',
                                'jobTitle': 'Dr.',
                                'memberOf': 'http://ns.dasch.swiss/test-dasch'
                            }
                        },
                        {
                            'type': 'http://www.w3.org/ns/prov#Attribution',
                            'role': 'contributor',
                            'agent': {
                                'type': 'http://ns.dasch.swiss/repository#Person',
                                'id': 'http://ns.dasch.swiss/test-hart',
                                'address': {
                                    'type': 'https://schema.org/PostalAddress',
                                    'addressLocality': 'Basel',
                                    'postalCode': '4000',
                                    'streetAddress': 'Teststrasse'
                                },
                                'email': 'leonhard.hart@test.ch',
                                'familyName': 'Hart',
                                'givenName': 'Leonhard',
                                'jobTitle': 'Prof.',
                                'memberOf': 'http://ns.dasch.swiss/test-dasch'
                            }
                        },
                        {
                            'type': 'http://www.w3.org/ns/prov#Attribution',
                            'role': 'editor',
                            'agent': {
                                'type': 'http://ns.dasch.swiss/repository#Person',
                                'id': 'http://ns.dasch.swiss/test-hart',
                                'address': {
                                    'type': 'https://schema.org/PostalAddress',
                                    'addressLocality': 'Basel',
                                    'postalCode': '4000',
                                    'streetAddress': 'Teststrasse'
                                },
                                'email': 'leonhard.hart@test.ch',
                                'familyName': 'Hart',
                                'givenName': 'Leonhard',
                                'jobTitle': 'Prof.',
                                'memberOf': 'http://ns.dasch.swiss/test-dasch'
                            }
                        },
                        {
                            'type': 'http://www.w3.org/ns/prov#Attribution',
                            'role': 'editor',
                            'agent': {
                                'type': 'http://ns.dasch.swiss/repository#Person',
                                'id': 'http://ns.dasch.swiss/test-coleman',
                                'address': {
                                    'type': 'https://schema.org/PostalAddress',
                                    'addressLocality': 'Basel',
                                    'postalCode': '4000',
                                    'streetAddress': 'Teststrasse'
                                },
                                'email': 'james.coleman@dasch.swiss',
                                'familyName': 'Coleman',
                                'givenName': 'James',
                                'jobTitle': 'Dr. des.',
                                'memberOf': 'http://ns.dasch.swiss/test-dasch'
                            }
                        },
                        {
                            'type': 'http://www.w3.org/ns/prov#Attribution',
                            'role': 'editor',
                            'agent': {
                                'type': 'http://ns.dasch.swiss/repository#Person',
                                'id': 'http://ns.dasch.swiss/test-jones',
                                'address': {
                                    'type': 'https://schema.org/PostalAddress',
                                    'addressLocality': 'Basel',
                                    'postalCode': '4000',
                                    'streetAddress': 'Teststrasse'
                                },
                                'email': 'benjamin.jones@test.ch',
                                'familyName': 'Jones',
                                'givenName': 'Benjamin',
                                'jobTitle': 'Dr. des.',
                                'memberOf': 'http://ns.dasch.swiss/test-dasch'
                            }
                        }
                    ],
                    'status': 'ongoing',
                    'title': 'Testprojekt',
                    'typeOfData': [
                        'image',
                        'text'
                    ],
                    'project': {
                        'type': 'http://ns.dasch.swiss/repository#Project',
                        'id': 'http://ns.dasch.swiss/test-project',
                        'alternateName': 'test',
                        'contactPoint': {
                            'type': 'http://ns.dasch.swiss/repository#Person',
                            'id': 'http://ns.dasch.swiss/test-abraham',
                            'address': {
                                'type': 'https://schema.org/PostalAddress',
                                'addressLocality': 'Basel',
                                'postalCode': '4000',
                                'streetAddress': 'Teststrasse'
                            },
                            'email': 'stewart.abraham@test.ch',
                            'familyName': 'Abraham',
                            'givenName': 'Stewart',
                            'jobTitle': 'Dr.',
                            'memberOf': 'http://ns.dasch.swiss/test-dasch',
                            'sameAs': {
                                'type': 'https://schema.org/URL',
                                'value': 'https://orcid.org/0000-0002-1825-0097'
                            }
                        },
                        'dataManagementPlan': {
                            'type': 'http://ns.dasch.swiss/repository#DataManagementPlan',
                            'id': 'http://ns.dasch.swiss/test-plan',
                            'url': {
                                'type': 'https://schema.org/URL',
                                'value': 'https://snf.ch'
                            },
                            'isAvailable': true
                        },
                        'description': 'Dies ist ein Testprojekt...alle Properties wurden verwendet, um diese zu testen',
                        'discipline': {
                            'name': 'SKOS UNESCO Nomenclature',
                            'url': 'http://skos.um.es/unesco6/11'
                        },
                        'endDate': '2001-01-26',
                        'funder': {
                            'id': 'http://ns.dasch.swiss/test-funder'
                        },
                        'grant': {
                            'type': 'http://ns.dasch.swiss/repository#Grant',
                            'id': 'http://ns.dasch.swiss/test-grant',
                            'funder': {
                                'id': 'http://ns.dasch.swiss/test-funder'
                            },
                            'name': 'Prof. test test, Prof. test Harbtestrecht',
                            'number': '0123456789',
                            'url': {
                                'type': 'https://schema.org/URL',
                                'value': 'http://p3.snf.ch/testproject'
                            }
                        },
                        'keywords': [
                            'science',
                            'mathematics',
                            'history of science',
                            'history of mathematics'
                        ],
                        'name': 'Testprojektname (test)',
                        'publication': 'testpublication',
                        'shortcode': '0000',
                        'spatialCoverage': [
                            {
                                'place': {
                                    'name': 'Geonames',
                                    'url': 'https://www.geonames.org/2658434/switzerland.html'
                                }
                            },
                            {
                                'place': {
                                    'name': 'Geonames',
                                    'url': 'https://www.geonames.org/6255148/europe.html'
                                }
                            },
                            {
                                'place': {
                                    'name': 'Geonames',
                                    'url': 'https://www.geonames.org/3017382/republic-of-france.html'
                                }
                            },
                            {
                                'place': {
                                    'name': 'Geonames',
                                    'url': 'https://www.geonames.org/6269131/england.html'
                                }
                            },
                            {
                                'place': {
                                    'name': 'Geonames',
                                    'url': 'https://www.geonames.org/2017370/russian-federation.html'
                                }
                            },
                            {
                                'place': {
                                    'name': 'Geonames',
                                    'url': 'https://www.geonames.org/2921044/federal-republic-of-germany.html'
                                }
                            },
                            {
                                'place': {
                                    'name': 'Geonames',
                                    'url': 'https://www.geonames.org/3175395/italian-republic.html'
                                }
                            }
                        ],
                        'startDate': '2000-07-26',
                        'temporalCoverage': {
                            'name': 'Chronontology Dainst',
                            'url': 'http://chronontology.dainst.org/period/Ef9SyESSafJ1'
                        },
                        'url': {
                            'type': 'https://schema.org/URL',
                            'value': 'https://test.dasch.swiss/'
                        }
                    },
                    'sameAs': {
                        'type': 'https://schema.org/URL',
                        'value': 'https://test.dasch.swiss'
                    }
                }
            ]
        };

        // convert metadata to use IDataset interface
        this.datasets = this.metadata['projectsMetadata'] as IDataset[];

        // by default display first dataset
        this.selectedDataset = this.datasets[0];

        const dsOptions = [];
        // dataset options to display radio buttons for selection in right column
        for (let idx = 0; idx < this.datasets.length; idx++) {
            dsOptions.push({
                name: this.datasets[idx].title,
                id: idx,
                checked: idx === 0 ? true : false
            });
        }

        this.datasetOptions = dsOptions;
    }

    // download metadata
    downloadMetadata() {
        const blob: Blob = new Blob([JSON.stringify(this.metadata)], {type: 'application/json'});
        const fileName: string = 'metadata.json';
        const objectUrl: string = URL.createObjectURL(blob);
        const a: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;

        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    }

    updateDataset(event: MatRadioChange) {
        this.selectedDataset = this.datasets[event.value];
    }

    copyHowToCiteToClipboard() {
        this._clipboardService.copyFromContent(this.selectedDataset.howToCite);
    }

    openDialog(mode: string, name: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: {mode: mode, title: name, project: id}
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(response => {
            // update the view
            this.getProject();
        });
    }
}
