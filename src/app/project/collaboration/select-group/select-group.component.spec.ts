import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import {
    AppInitService,
    DspApiConfigToken,
    DspApiConnectionToken,
    DspCoreModule
} from '@dasch-swiss/dsp-ui';
import { TestConfig } from 'test.config';
import { SelectGroupComponent } from './select-group.component';

describe('SelectGroupComponent', () => {
    let component: SelectGroupComponent;
    let fixture: ComponentFixture<SelectGroupComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SelectGroupComponent],
            imports: [
                DspCoreModule,
                MatDialogModule,
                MatFormFieldModule,
                MatSelectModule,
                MatSnackBarModule,
                ReactiveFormsModule
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
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SelectGroupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check if we get the list of groups
});
