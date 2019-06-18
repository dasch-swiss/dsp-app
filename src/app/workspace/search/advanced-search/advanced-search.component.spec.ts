import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedSearchComponent } from './advanced-search.component';
import { MatExpansionModule } from '@angular/material';
import { KuiSearchModule } from '@knora/search';
import { KuiViewerModule } from '@knora/viewer';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiCoreConfigToken, KuiCoreConfig } from '@knora/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

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
                {
                    provide: KuiCoreConfigToken,
                    useValue: KuiCoreConfig
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
