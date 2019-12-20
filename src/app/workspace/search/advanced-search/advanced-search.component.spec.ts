import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatExpansionModule } from '@angular/material/expansion';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { KuiViewerModule } from '@knora/viewer';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { AdvancedSearchComponent } from './advanced-search.component';

describe('AdvancedSearchComponent', () => {
    let component: AdvancedSearchComponent;
    let fixture: ComponentFixture<AdvancedSearchComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AdvancedSearchComponent],
            imports: [
                HttpClientTestingModule,
                KuiSearchModule,
                KuiViewerModule,
                MatExpansionModule,
                RouterTestingModule
            ],
            providers: [
                {
                    provide: ActivatedRoute
                },
                AppInitService,
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
        fixture = TestBed.createComponent(AdvancedSearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
