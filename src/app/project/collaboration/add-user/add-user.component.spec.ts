import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiCoreModule } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { AddUserComponent } from './add-user.component';

describe('AddUserComponent', () => {
    let component: AddUserComponent;
    let fixture: ComponentFixture<AddUserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AddUserComponent],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatAutocompleteModule,
                MatDialogModule,
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
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddUserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
