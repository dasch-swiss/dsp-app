import { of } from 'rxjs';
import { ErrorComponent } from 'src/app/main/error/error.component';

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
    MatButtonModule, MatChipsModule, MatDialogModule, MatExpansionModule, MatIconModule,
    MatMenuModule, MatTooltipModule
} from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { Session } from '@knora/authentication';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';

import { ListItemFormComponent } from './list-item-form/list-item-form.component';
import { ListItemComponent } from './list-item/list-item.component';
import { ListComponent } from './list.component';

describe('ListComponent', () => {
    let component: ListComponent;
    let fixture: ComponentFixture<ListComponent>;

    const shortcode = '0001';

    const currentTestSession: Session = {
        id: 1555226377250,
        user: {
            jwt: '',
            lang: 'en',
            name: 'root',
            projectAdmin: [],
            sysAdmin: false
        }
    };

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ListComponent,
                ListItemComponent,
                ListItemFormComponent,
                ErrorComponent
            ],
            imports: [
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
                                        return shortcode;
                                    }
                                }
                            })
                        }
                    }
                },
                {
                    provide: KuiCoreConfigToken,
                    useValue: KuiCoreConfig
                }
            ]
        }).compileComponents();
    }));

    // mock localStorage
    beforeEach(() => {
        let store = {};

        spyOn(localStorage, 'getItem').and.callFake(
            (key: string): String => {
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
        localStorage.setItem('session', JSON.stringify(currentTestSession));

        fixture = TestBed.createComponent(ListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(currentTestSession)
        );
        expect(component).toBeTruthy();
    });
});
