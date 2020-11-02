import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import {
    AppInitService,
    DspActionModule,
    DspApiConfigToken,
    DspApiConnectionToken,
    DspCoreModule
} from '@dasch-swiss/dsp-ui';
import { TranslateModule } from '@ngx-translate/core';
import { TestConfig } from 'test.config';
import { ListItemFormComponent } from '../list-item-form/list-item-form.component';
import { ListItemComponent } from '../list-item/list-item.component';
import { ListInfoFormComponent } from './list-info-form.component';

describe('ListInfoFormComponent', () => {
    let component: ListInfoFormComponent;
    let fixture: ComponentFixture<ListInfoFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ListInfoFormComponent,
                ListItemComponent,
                ListItemFormComponent
            ],
            imports: [
                BrowserAnimationsModule,
                HttpClientModule,
                DspActionModule,
                DspCoreModule,
                MatIconModule,
                MatInputModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
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
        fixture = TestBed.createComponent(ListInfoFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
