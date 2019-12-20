import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiConfig, KuiConfigToken } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { KuiViewerModule } from '@knora/viewer';
import { TranslateModule } from '@ngx-translate/core';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { ExpertSearchComponent } from './expert-search.component';

describe('ExpertSearchComponent', () => {
    let component: ExpertSearchComponent;
    let fixture: ComponentFixture<ExpertSearchComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ExpertSearchComponent],
            imports: [
                KuiSearchModule,
                KuiViewerModule,
                MatButtonModule,
                MatExpansionModule,
                MatFormFieldModule,
                MatInputModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: ActivatedRoute
                },
                AppInitService,
                {
                    provide: KuiConfigToken,
                    useValue: new KuiConfig(TestConfig.ApiConfig, TestConfig.AppConfig)
                },
                {
                    provide: KnoraApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: KnoraApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ExpertSearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
