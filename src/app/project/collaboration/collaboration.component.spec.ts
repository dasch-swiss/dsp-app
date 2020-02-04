import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiCoreModule, Session } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppInitService } from 'src/app/app-init.service';
import { ErrorComponent } from 'src/app/main/error/error.component';
import { UsersListComponent } from 'src/app/system/users/users-list/users-list.component';
import { TestConfig } from 'test.config';
import { AddUserComponent } from './add-user/add-user.component';
import { CollaborationComponent } from './collaboration.component';
import { SelectGroupComponent } from './select-group/select-group.component';

describe('CollaborationComponent', () => {
    let component: CollaborationComponent;
    let fixture: ComponentFixture<CollaborationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                CollaborationComponent,
                AddUserComponent,
                UsersListComponent,
                SelectGroupComponent,
                ErrorComponent
            ],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatAutocompleteModule,
                MatButtonModule,
                MatChipsModule,
                MatIconModule,
                MatInputModule,
                MatMenuModule,
                MatSelectModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
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

        fixture = TestBed.createComponent(CollaborationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
        expect(component).toBeTruthy();
    });

    // todo: check if the list is initialized, check the filter
    // check if the user is added and removed from the list, check if it is not possible to add a user that already exists in the list -> may be implemented in the add-user component
});
