import { Component, Input } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AngularSplitModule } from 'angular-split';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import {
    DspApiConfigToken,
    DspApiConnectionToken,
} from '@dasch-swiss/vre/shared/app-config';
import { TestConfig } from '@dsp-app/src/test.config';
import { ResourceComponent } from '../resource/resource.component';
import { SearchParams } from './list-view/list-view.component';
import { ResultsComponent } from './results.component';

/**
 * test component that mocks ListViewComponent
 */
@Component({ selector: 'app-list-view', template: '' })
class MockListViewComponent {
    @Input() search: SearchParams;
    @Input() withMultipleSelection?: boolean = false;
    constructor() {}
}

describe('ResultsComponent', () => {
    let component: ResultsComponent;
    let fixture: ComponentFixture<ResultsComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                ResultsComponent,
                ResourceComponent,
                MockListViewComponent,
            ],
            imports: [AngularSplitModule, RouterTestingModule],
            providers: [
                AppConfigService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig,
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig),
                },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ResultsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
