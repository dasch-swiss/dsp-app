import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
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
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorComponent } from 'src/app/main/error/error.component';
import { TestConfig } from 'test.config';
import { MembershipComponent } from './membership.component';

describe('MembershipComponent', () => {
    let component: MembershipComponent;
    let fixture: ComponentFixture<MembershipComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                MembershipComponent,
                DialogComponent,
                ErrorComponent
            ],
            imports: [
                BrowserAnimationsModule,
                DspActionModule,
                DspCoreModule,
                MatButtonModule,
                MatDividerModule,
                MatIconModule,
                MatListModule,
                MatSelectModule,
                ReactiveFormsModule,
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
        fixture = TestBed.createComponent(MembershipComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
