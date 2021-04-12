import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import {
    AppInitService,
    DspApiConfigToken,
    DspApiConnectionToken,
    DspCoreModule,
    DspViewerModule
} from '@dasch-swiss/dsp-ui';
import { AngularSplitModule } from 'angular-split';
import { TestConfig } from 'test.config';
import { ResourceComponent } from '../resource/resource.component';
import { ResultsComponent } from './results.component';

describe('ResultsComponent', () => {
    let component: ResultsComponent;
    let fixture: ComponentFixture<ResultsComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                ResultsComponent,
                ResourceComponent
            ],
            imports: [
                AngularSplitModule,
                DspCoreModule,
                DspViewerModule,
                RouterTestingModule
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        })
            .compileComponents();
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
