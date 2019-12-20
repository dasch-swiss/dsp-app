import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule, MatChipsModule, MatDialogModule, MatExpansionModule, MatIconModule, MatMenuModule, MatTooltipModule } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiCoreModule, Session } from '@knora/core';
import { of } from 'rxjs';
import { AppInitService } from 'src/app/app-init.service';
import { ErrorComponent } from 'src/app/main/error/error.component';
import { TestConfig } from 'test.config';
import { ListItemFormComponent } from './list-item-form/list-item-form.component';
import { ListItemComponent } from './list-item/list-item.component';
import { ListComponent } from './list.component';
import { HttpClientModule } from '@angular/common/http';

describe('ListComponent', () => {
    let component: ListComponent;
    let fixture: ComponentFixture<ListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ListComponent,
                ListItemComponent,
                ListItemFormComponent,
                ErrorComponent
            ],
            imports: [
                HttpClientModule,
                KuiActionModule,
                KuiCoreModule,
                MatButtonModule,
                MatChipsModule,
                MatDialogModule,
                MatExpansionModule,
                MatIconModule,
                MatMenuModule,
                MatTooltipModule,
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

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): string => {
                return store[key] || null;
            }
        );
        spyOn(localStorage, 'removeItem').and.callFake(
            (key: string): void => {
                delete store[key];
            }
        );
        spyOn(localStorage, 'setItem').and.callFake(
            (key: string, value: string): string => {
                return (store[key] = <any>value);
            }
        );
        spyOn(localStorage, 'clear').and.callFake(() => {
            store = {};
        });
    });

    beforeEach(() => {
        localStorage.setItem('session', JSON.stringify(TestConfig.CurrentSession));

        fixture = TestBed.createComponent(ListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
        expect(component).toBeTruthy();
    });
});
