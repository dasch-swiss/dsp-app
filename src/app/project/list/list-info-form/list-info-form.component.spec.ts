import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule, MatInputModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiCoreModule } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { ListItemFormComponent } from '../list-item-form/list-item-form.component';
import { ListItemComponent } from '../list-item/list-item.component';
import { ListInfoFormComponent } from './list-info-form.component';
import { HttpClientModule } from '@angular/common/http';

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
                HttpClientModule,
                KuiActionModule,
                KuiCoreModule,
                MatIconModule,
                MatInputModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
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
