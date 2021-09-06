import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppInitService, DspActionModule } from '@dasch-swiss/dsp-ui';
import { of } from 'rxjs';
import { DspApiConfigToken, DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorComponent } from 'src/app/main/error/error.component';
import { TestConfig } from 'test.config';
import { AttributionTabViewComponent } from './attribution-tab-view/attribution-tab-view.component';
import { BoardComponent } from './board.component';
import { ContactsTabViewComponent } from './contacts-tab-view/contacts-tab-view.component';
import { DatasetTabViewComponent } from './dataset-tab-view/dataset-tab-view.component';
import { ProjectTabViewComponent } from './project-tab-view/project-tab-view.component';
import { TermsTabViewComponent } from './terms-tab-view/terms-tab-view.component';

describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                BoardComponent,
                DialogComponent,
                ErrorComponent,
                AttributionTabViewComponent,
                ContactsTabViewComponent,
                DatasetTabViewComponent,
                ProjectTabViewComponent,
                TermsTabViewComponent
            ],
            imports: [
                BrowserAnimationsModule,
                DspActionModule,
                MatChipsModule,
                MatDialogModule,
                MatDividerModule,
                MatIconModule,
                RouterTestingModule
            ],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        parent: {
                            paramMap: of({
                                get: (param: string) => {
                                    if (param === 'shortcode') {
                                        return TestConfig.ProjectCode;
                                    }
                                }
                            })
                        }
                    }
                },
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

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): string => store[key] || null
        );
        spyOn(localStorage, 'removeItem').and.callFake(
            (key: string): void => {
                delete store[key];
            }
        );
        spyOn(localStorage, 'setItem').and.callFake(
            (key: string, value: string): string => (store[key] = <any>value)
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {
        localStorage.setItem('session', JSON.stringify(TestConfig.CurrentSession));

        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
        expect(component).toBeTruthy();
    });

    // todo: check the project name, if there is description and keywords, check if we can edit the project info if the user is project admin or system admin (edit btn displayed)
    // check if you get the project by shortcode
    // check if you get the project metadata
});
