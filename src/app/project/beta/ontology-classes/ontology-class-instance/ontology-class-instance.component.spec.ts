import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { AppInitService } from 'src/app/app-init.service';
import { DspApiConfigToken, DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { TestConfig } from 'test.config';
import { OntologyClassInstanceComponent } from './ontology-class-instance.component';


describe('OntologyClassInstanceComponent', () => {
    let component: OntologyClassInstanceComponent;
    let fixture: ComponentFixture<OntologyClassInstanceComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch'
        }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OntologyClassInstanceComponent],
            imports: [
                MatSnackBarModule,
                MatDialogModule,
                RouterTestingModule
            ],
            providers: [
                {
                    provide: AppInitService,
                    useValue: appInitSpy
                },
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        params: of({
                            onto: 'anything',
                            class: 'BlueThing',
                        }),
                        parent: {
                            snapshot: {
                                params: { shortcode: '0001' }
                            }
                        }
                    }
                }

            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OntologyClassInstanceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
