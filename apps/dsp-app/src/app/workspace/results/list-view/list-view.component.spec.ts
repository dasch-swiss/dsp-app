import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import {
    CountQueryResponse,
    IFulltextSearchParams,
    MockResource,
    ReadResourceSequence,
    SearchEndpointV2,
} from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { ListViewComponent, SearchParams } from './list-view.component';

/**
 * test component to simulate child component, here resource-list.
 */
@Component({
    selector: 'app-resource-list',
    template: '',
})
class TestResourceListComponent {
    @Input() resources: ReadResourceSequence;

    @Input() selectedResourceIdx: number;

    @Input() withMultipleSelection?: boolean = false;
}

/**
 * test component to simulate child component, here progress-indicator from action module.
 */
@Component({
    selector: 'app-progress-indicator',
    template: '',
})
class TestProgressIndicatorComponent {}

/**
 * test parent component to simulate integration of list-view component.
 */
@Component({
    template: ` <app-list-view
            #listViewFulltext
            [search]="fulltext"
            (selectedResources)="openResource($event)"
        ></app-list-view>
        <app-list-view
            #listViewGravsearch
            [search]="gravsearch"
            (selectedResources)="openResource($event)"
        ></app-list-view>`,
})
class TestParentComponent implements OnInit {
    @ViewChild('listViewFulltext') listViewFulltext: ListViewComponent;
    @ViewChild('listViewGravsearch') listViewGravsearch: ListViewComponent;

    fulltext: SearchParams;
    gravsearch: SearchParams;

    resIri: string;

    ngOnInit() {
        this.fulltext = {
            query: 'fake query',
            mode: 'fulltext',
            filter: {
                limitToProject: 'http://rdfh.ch/projects/0803',
            },
        };

        this.gravsearch = {
            query: 'fake query OFFSET 0',
            mode: 'gravsearch',
        };
    }

    openResource(id: string) {
        this.resIri = id;
    }
}

describe('ListViewComponent', () => {
    let testHostComponent: TestParentComponent;
    let testHostFixture: ComponentFixture<TestParentComponent>;

    beforeEach(waitForAsync(() => {
        const searchSpyObj = {
            v2: {
                search: jasmine.createSpyObj('search', [
                    'doFulltextSearch',
                    'doFulltextSearchCountQuery',
                    'doExtendedSearch',
                    'doExtendedSearchCountQuery',
                ]),
            },
        };

        TestBed.configureTestingModule({
            declarations: [
                ListViewComponent,
                TestParentComponent,
                TestProgressIndicatorComponent,
                TestResourceListComponent,
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatDialogModule,
                MatIconModule,
                MatPaginatorModule,
                MatSnackBarModule,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: searchSpyObj,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        parent: {
                            snapshot: {
                                url: [{ path: 'project' }],
                            },
                        },
                    },
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        const searchSpy = TestBed.inject(DspApiConnectionToken);

        (
            searchSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>
        ).doFulltextSearchCountQuery.and.callFake(() => {
            const num = new CountQueryResponse();
            num.numberOfResults = 5;
            return of(num);
        });

        (
            searchSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>
        ).doFulltextSearch.and.callFake(
            (
                searchTerm: string,
                offset?: number,
                params?: IFulltextSearchParams
            ) => {
                let resources: ReadResourceSequence;
                // mock list of resourcses to simulate full-text search response
                MockResource.getTestThings(5).subscribe((res) => {
                    resources = res;
                });
                if (resources.resources.length) {
                    return of(resources);
                }
            }
        );

        (
            searchSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>
        ).doExtendedSearchCountQuery.and.callFake(() => {
            const num = new CountQueryResponse();
            num.numberOfResults = 5;
            return of(num);
        });

        (
            searchSpy.v2.search as jasmine.SpyObj<SearchEndpointV2>
        ).doExtendedSearch.and.callFake((searchTerm: string) => {
            let resources: ReadResourceSequence;
            // mock list of resourcses to simulate full-text search response
            MockResource.getTestThings(5).subscribe((res) => {
                resources = res;
            });
            if (resources.resources.length) {
                return of(resources);
            }
        });

        testHostFixture = TestBed.createComponent(TestParentComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should do fulltext search', () => {
        const searchSpy = TestBed.inject(DspApiConnectionToken);

        // do fulltext search count query
        expect(
            searchSpy.v2.search.doFulltextSearchCountQuery
        ).toHaveBeenCalledWith('fake query', 0, {
            limitToProject: 'http://rdfh.ch/projects/0803',
        });

        // do fulltext search
        expect(searchSpy.v2.search.doFulltextSearch).toHaveBeenCalledWith(
            'fake query',
            0,
            { limitToProject: 'http://rdfh.ch/projects/0803' }
        );
        expect(
            testHostComponent.listViewFulltext.resources.resources.length
        ).toBe(5);
    });

    it('should do advanced search', () => {
        const searchSpy = TestBed.inject(DspApiConnectionToken);

        // do advanced search count query
        expect(
            searchSpy.v2.search.doExtendedSearchCountQuery
        ).toHaveBeenCalledWith('fake query OFFSET 0');

        // do advanced search
        expect(searchSpy.v2.search.doExtendedSearch).toHaveBeenCalledWith(
            'fake query OFFSET 0'
        );
        expect(
            testHostComponent.listViewGravsearch.resources.resources.length
        ).toBe(5);
    });
});
