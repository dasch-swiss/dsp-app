import { OverlayModule } from '@angular/cdk/overlay';
import {
    Component,
    EventEmitter,
    Input,
    Output,
    ViewChild,
} from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SearchPanelComponent } from './search-panel.component';

/**
 * test host component to simulate child component, here fulltext-search.
 */
@Component({
    selector: 'app-fulltext-search',
})
class TestFulltextSearchComponent {
    @Input() projectfilter?: boolean = false;
    @Input() limitToProject?: string;
    @Input() show: boolean;
    @Output() showState = new EventEmitter();
}

/**
 * test host component to simulate parent component with a search panel.
 */
@Component({
    template: ` <app-search-panel
        #searchPanelView
        [projectfilter]="projectfilter"
        [expert]="expert"
        [advanced]="advanced"
    >
    </app-search-panel>`,
})
class TestHostComponent {
    @ViewChild('searchPanelView') searchPanelComponent: SearchPanelComponent;

    projectfilter = true;
    advanced = false;
    expert = false;
}

describe('SearchPanelComponent', () => {
    let testHostComponent: TestHostComponent;
    let testHostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                SearchPanelComponent,
                TestHostComponent,
                TestFulltextSearchComponent,
            ],
            imports: [OverlayModule, MatMenuModule, MatIconModule],
        }).compileComponents();
    }));

    beforeEach(() => {
        testHostFixture = TestBed.createComponent(TestHostComponent);
        testHostComponent = testHostFixture.componentInstance;
        testHostFixture.detectChanges();

        expect(testHostComponent).toBeTruthy();
    });

    it('should create an instance', () => {
        expect(testHostComponent.searchPanelComponent).toBeTruthy();
    });
});
