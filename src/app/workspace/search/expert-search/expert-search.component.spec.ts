import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiCoreConfig, KuiConfigToken } from '@knora/core';
import { KuiSearchModule } from '@knora/search';
import { KuiViewerModule } from '@knora/viewer';
import { TranslateModule } from '@ngx-translate/core';
import { ExpertSearchComponent } from './expert-search.component';

xdescribe('ExpertSearchComponent', () => {
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
                    provide: KuiConfigToken,
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
