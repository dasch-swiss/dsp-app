import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiConfigToken, KuiCoreModule } from '@knora/core';
import { SelectGroupComponent } from 'src/app/project/collaboration/select-group/select-group.component';
import { UsersListComponent } from './users-list.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Session } from '@knora/authentication';

describe('UsersListComponent', () => {
    let component: UsersListComponent;
    let fixture: ComponentFixture<UsersListComponent>;

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
            declarations: [UsersListComponent, SelectGroupComponent],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatButtonModule,
                MatChipsModule,
                MatDialogModule,
                MatIconModule,
                MatMenuModule,
                MatSelectModule,
                ReactiveFormsModule,
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
                    provide: KuiConfigToken,
                    useValue: KuiCoreConfig
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
        localStorage.setItem('session', JSON.stringify(currentTestSession));

        fixture = TestBed.createComponent(UsersListComponent);
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
