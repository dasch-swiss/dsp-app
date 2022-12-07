import { OverlayModule } from '@angular/cdk/overlay';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MockProjects, ProjectsEndpointAdmin } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs/internal/observable/of';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { SortingService } from 'src/app/main/services/sorting.service';
import { FulltextSearchComponent } from './fulltext-search.component';

/**
 * test host component to simulate parent component.
 */
@Component({
    selector: 'app-host-component',
    template: `
        <app-fulltext-search #fulltextSearch
            [projectfilter]="projectfilter"
            [limitToProject]="limitToProject">
        </app-fulltext-search>
    `
})
class TestHostFulltextSearchComponent implements OnInit {

    @ViewChild('fulltextSearch') fulltextSearch: FulltextSearchComponent;

    sortingService: SortingService = new SortingService();

    projectfilter?: boolean = true;

    limitToProject?: string;

    ngOnInit() {
    }

}

interface PrevSearchItem {
    projectIri?: string;
    projectLabel?: string;
    query: string;
}

describe('FulltextSearchComponent', () => {
    let testHostComponent: TestHostFulltextSearchComponent;
    let testHostFixture: ComponentFixture<TestHostFulltextSearchComponent>;
    let fulltextSearchComponentDe;
    let hostCompDe;
    let dspConnSpy;
    let prevSearchArray: PrevSearchItem[];

    beforeEach(waitForAsync(() => {

        dspConnSpy = {
            admin: {
                projectsEndpoint: jasmine.createSpyObj('projectsEndpoint', ['getProjects', 'getProjectByIri'])
            }
        };

        TestBed.configureTestingModule({
            declarations: [
                FulltextSearchComponent,
                TestHostFulltextSearchComponent
            ],
            imports: [
                BrowserAnimationsModule,
                FormsModule,
                MatDialogModule,
                MatDividerModule,
                MatIconModule,
                MatInputModule,
                MatListModule,
                MatMenuModule,
                MatSnackBarModule,
                MatTooltipModule,
                OverlayModule,
            ],
            providers: [
                {
                    provide: DspApiConnectionToken,
                    useValue: dspConnSpy
                }
            ]
        })
            .compileComponents();

    }));

    beforeEach(() => {

        // mock local storage
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake((key: string): string => store[key] || null);
        spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
            delete store[key];
        });
        spyOn(localStorage, 'setItem').and.callFake((key: string, value: string): string => store[key] = value as string);
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {

        // initiate the local storage prevSearch
        prevSearchArray = [
            { projectIri: 'http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w', projectLabel: 'incunabula', query: 'one thing' },
            { projectIri: 'http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w', projectLabel: 'incunabula', query: 'two things' },
            { projectIri: 'http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ', projectLabel: 'anything', query: 'hello world' }
        ];

        localStorage.setItem('prevSearch', JSON.stringify(prevSearchArray));
        expect(localStorage.getItem('prevSearch')).toBeDefined();
    });

    beforeEach(() => {

        // mock getProjects response
        const valuesSpy = TestBed.inject(DspApiConnectionToken);

        (valuesSpy.admin.projectsEndpoint as jasmine.SpyObj<ProjectsEndpointAdmin>).getProjects.and.callFake(
            () => {
                const projects = MockProjects.mockProjects();
                return of(projects);
            }
        );

        testHostFixture = TestBed.createComponent(TestHostFulltextSearchComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        hostCompDe = testHostFixture.debugElement;
        fulltextSearchComponentDe = hostCompDe.query(By.directive(FulltextSearchComponent));
    });


    it('should create', () => {
        expect(testHostComponent).toBeTruthy();
        expect(testHostComponent.fulltextSearch).toBeTruthy();
    });

    it('should get projects on init', () => {
        const projSpy = TestBed.inject(DspApiConnectionToken);
        expect(projSpy.admin.projectsEndpoint.getProjects).toHaveBeenCalledTimes(1);

        expect(testHostComponent.fulltextSearch.projects).toBeDefined();
        expect(testHostComponent.fulltextSearch.projects.length).toEqual(8);
        expect(testHostComponent.fulltextSearch.projectfilter).toEqual(true);
        expect(testHostComponent.fulltextSearch.projectLabel).toEqual('All projects');
    });

    describe('perform or reset search', () => {

        let searchInputNativeEl;

        beforeEach(() => {

            searchInputNativeEl = fulltextSearchComponentDe.query(By.css('input.app-fulltext-search-input')).nativeElement;
        });

        it('should do a search', () => {
            const searchBtn = fulltextSearchComponentDe.query(By.css('button.app-fulltext-search-button'));
            expect(searchBtn).toBeDefined();
            expect(searchInputNativeEl).toBeDefined();

            searchInputNativeEl.value = 'new thing';
            searchInputNativeEl.dispatchEvent(new Event('input'));

            // click on the search button and trigger the method doSearch()
            searchBtn.triggerEventHandler('click', null);
            testHostFixture.detectChanges();

            // check the local storage state
            expect(testHostComponent.fulltextSearch.searchQuery).toEqual('new thing');
            const newPrevSearchArray: PrevSearchItem[] = [
                { projectIri: 'http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w', projectLabel: 'incunabula', query: 'one thing' },
                { projectIri: 'http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w', projectLabel: 'incunabula', query: 'two things' },
                { projectIri: 'http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ', projectLabel: 'anything', query: 'hello world' },
                { query: 'new thing' }
            ];
            expect(localStorage.getItem('prevSearch')).toEqual(JSON.stringify(newPrevSearchArray));

        });

        it('should perform a search with a previous item', () => {
            // click in the search input to open the search panel
            expect(searchInputNativeEl).toBeDefined();
            searchInputNativeEl.click();
            testHostFixture.detectChanges();

            const searchMenuPanel = fulltextSearchComponentDe.query(By.css('div.app-search-menu')).nativeElement;
            expect(searchMenuPanel).toBeDefined();

            const prevSearchItem = fulltextSearchComponentDe.query(By.css('div.app-previous-search-query')).nativeElement;
            prevSearchItem.click();
            testHostFixture.detectChanges();

            expect(testHostComponent.fulltextSearch.searchQuery).toEqual('hello world');
            expect(testHostComponent.fulltextSearch.projectIri).toEqual('http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ');
            expect(testHostComponent.fulltextSearch.projectLabel).toEqual('anything');

        });

        it('should perform a search with a previous item - solution 2', () => {
            testHostComponent.fulltextSearch.doPrevSearch(prevSearchArray[0]);

            expect(testHostComponent.fulltextSearch.searchQuery).toEqual('one thing');
            expect(testHostComponent.fulltextSearch.projectIri).toEqual('http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w');
            expect(testHostComponent.fulltextSearch.projectLabel).toEqual('incunabula');

        });

    });

    describe('clear the search list', () => {

        let searchInputNativeEl;

        beforeEach(() => {
            searchInputNativeEl = fulltextSearchComponentDe.query(By.css('input.app-fulltext-search-input')).nativeElement;
        });

        it('should remove one item of the search list - solution 1', () => {
            // click in the search input to open the search panel
            expect(searchInputNativeEl).toBeDefined();
            searchInputNativeEl.click();
            testHostFixture.detectChanges();

            // click on the close icon to remove the item of the list
            const closeItemBtn = fulltextSearchComponentDe.query(By.css('mat-icon.mat-list-close-icon')).nativeElement;
            expect(closeItemBtn).toBeDefined();
            closeItemBtn.click();
            testHostFixture.detectChanges();

            const newPrevSearchArray: PrevSearchItem[] = [
                { projectIri: 'http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w', projectLabel: 'incunabula', query: 'two things' },
                { projectIri: 'http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w', projectLabel: 'incunabula', query: 'one thing' }
            ];
            expect(localStorage.getItem('prevSearch')).toEqual(JSON.stringify(newPrevSearchArray));
        });

        it('should remove one item of the search list - solution 2', () => {
            // prevSearch is set correctly at this stage:
            testHostComponent.fulltextSearch.resetPrevSearch(prevSearchArray[2]);

            const newPrevSearchArray: PrevSearchItem[] = [
                { projectIri: 'http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w', projectLabel: 'incunabula', query: 'one thing' },
                { projectIri: 'http://rdfh.ch/projects/yISnUYe6SYmoyuqeMdW39w', projectLabel: 'incunabula', query: 'two things' }
            ];
            expect(localStorage.getItem('prevSearch')).toEqual(JSON.stringify(newPrevSearchArray));
        });

        it('should clear the search list - solution 1', () => {
            // click in the search input to open the search panel
            expect(searchInputNativeEl).toBeDefined();
            searchInputNativeEl.click();
            testHostFixture.detectChanges();

            // click on the Clear List button to erase the search list
            const clearListBtn = fulltextSearchComponentDe.query(By.css('button.clear-list-btn')).nativeElement;
            expect(clearListBtn).toBeDefined();
            clearListBtn.click();
            testHostFixture.detectChanges();

            expect(localStorage.getItem('prevSearch')).toBe(null);
        });

        it('should clear the search list - solution 2', () => {
            testHostComponent.fulltextSearch.resetPrevSearch();

            expect(localStorage.getItem('prevSearch')).toBe(null);
        });

    });

    describe('project menu panel', () => {

        it('should get a menu panel with the list of projects', () => {
            const projButtonDe = fulltextSearchComponentDe.query(By.css('button.app-project-filter-button'));
            const projButtonNe = projButtonDe.nativeElement;

            expect(projButtonNe).toBeDefined();

            const projBtnLabelDe = projButtonDe.query(By.css('button > p.label'));
            const projBtnLabelNe = projBtnLabelDe.nativeElement;

            expect(projBtnLabelNe.innerHTML).toEqual('All projects');

            projButtonNe.click();
            testHostFixture.detectChanges();

            const projMenuPanelDe = projButtonDe.query(By.css('div.mat-menu-panel'));
            const projMenuPanelNe = projMenuPanelDe.nativeElement;

            expect(projMenuPanelNe).toBeDefined();
        });

        it('should select one project in the menu panel', () => {

            const projButtonDe = fulltextSearchComponentDe.query(By.css('button.app-project-filter-button'));
            const projButtonNe = projButtonDe.nativeElement;

            const projBtnLabelDe = projButtonDe.query(By.css('button > p.label'));
            const projBtnLabelNe = projBtnLabelDe.nativeElement;

            projButtonNe.click();
            testHostFixture.detectChanges();

            const projMenuPanelDe = projButtonDe.query(By.css('div.mat-menu-panel'));
            const projPanelItemDe = projMenuPanelDe.query(By.css('.project-item'));
            const projPanelItemNe = projPanelItemDe.nativeElement;

            projPanelItemNe.click();
            testHostFixture.detectChanges();

            expect(projBtnLabelNe.innerHTML).toEqual('anything');
            expect(testHostComponent.fulltextSearch.projectIri).toEqual('http://rdfh.ch/projects/Lw3FC39BSzCwvmdOaTyLqQ');
            expect(testHostComponent.fulltextSearch.projectLabel).toEqual('anything');
        });

    });

});
