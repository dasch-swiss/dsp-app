import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatExpansionModule, MatFormFieldModule, MatInputModule } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiCoreConfig, KuiCoreConfigToken } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { KuiViewerModule } from '@knora/viewer';
import { TranslateModule } from '@ngx-translate/core';
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
                {
                    provide: KuiCoreConfigToken,
                    useValue: KuiCoreConfig
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
