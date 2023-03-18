import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { DspApiConfigToken, DspApiConnectionToken } from '../declarations/dsp-api-tokens';
import { DialogComponent } from '../dialog/dialog.component';
import { StatusComponent } from '../status/status.component';
import { FooterComponent } from '../footer/footer.component';
import { GridComponent } from '../grid/grid.component';
import { HelpComponent } from './help.component';

describe('HelpComponent', () => {
    let component: HelpComponent;
    let fixture: ComponentFixture<HelpComponent>;

    const appInitSpy = {
        dspConfig: {
            environment: 'unit test server',
            release: '2022.02.02'
        }
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                HelpComponent,
                FooterComponent,
                GridComponent,
                DialogComponent,
                StatusComponent
            ],
            imports: [
                BrowserAnimationsModule,
                MatButtonModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
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
                },
                {
                    provide: AppInitService,
                    useValue: appInitSpy
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HelpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a mailto href incl. subject', () => {
        // get the support section and find the contact-us button
        const hostCompDe = fixture.debugElement;
        const section = hostCompDe.query(By.css('.support'));

        const grid = section.query(By.directive(GridComponent));
        const button = grid.query(By.css('.mailto'));
        const href = button.nativeElement.href;

        expect(href).toEqual('mailto:support@dasch.swiss?subject=DSP-APP%20request%20|%20unit%20test%20server:%202022.02.02');

    });

    // all other buttons have been tested in e2e tests => see e2e/src/help.e2e-spec.ts

});
