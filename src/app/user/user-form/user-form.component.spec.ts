import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UntypedFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ApiResponseData, KnoraApiConnection, MockUsers, ReadUser, UserResponse, UsersEndpointAdmin, UsersResponse } from '@dasch-swiss/dsp-js';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppInitService } from 'src/app/app-init.service';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { StatusComponent } from 'src/app/main/status/status.component';
import { TestConfig } from 'test.config';
import { PasswordFormComponent } from './password-form/password-form.component';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
    let component: UserFormComponent;
    let fixture: ComponentFixture<UserFormComponent>;
    const formBuilder: UntypedFormBuilder = new UntypedFormBuilder();

    // const cacheServiceSpyUser = jasmine.createSpyObj('CacheServiceUser', ['get']);
    const cacheServiceSpyAllUsers = jasmine.createSpyObj('CacheServiceAllUsers', ['get']);

    const apiSpyObj = {
        admin: {
            usersEndpoint: jasmine.createSpyObj('usersEndpoint', ['getUser', 'getUsers'])
        },
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                UserFormComponent,
                PasswordFormComponent,
                DialogComponent,
                StatusComponent
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatIconModule,
                MatInputModule,
                MatSelectModule,
                MatSlideToggleModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConnectionToken,
                    useValue: apiSpyObj
                },
                // {
                //     provide: CacheService,
                //     useValue: cacheServiceSpyUser
                // },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpyAllUsers
                },
                {
                    provide: UntypedFormBuilder,
                    useValue: formBuilder
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        localStorage.setItem('session', JSON.stringify(TestConfig.CurrentSession));

        const dspConnSpy = TestBed.inject(DspApiConnectionToken);
        (dspConnSpy.admin.usersEndpoint as jasmine.SpyObj<UsersEndpointAdmin>).getUsers.and.callFake(
            () => {
                const allUsers: ApiResponseData<UsersResponse> = MockUsers.mockUsers();;
                return of(allUsers);
            }
        );

        const cacheSpyAllUsers = TestBed.inject(CacheService);
        (cacheSpyAllUsers as jasmine.SpyObj<CacheService>).get.and.callFake(
            () => {
                const allUsers: ApiResponseData<UsersResponse> = MockUsers.mockUsers();
                return of(allUsers);
            }
        );

        fixture = TestBed.createComponent(UserFormComponent);
        component = fixture.componentInstance;
        component.userForm = formBuilder.group({
            givenName: ['', Validators.required],
            familyName: ['', Validators.required],
            email: ['', Validators.required],
            username: ['', Validators.required],
            password: ['', Validators.required],
            lang: ['en', Validators.required],
            status: ['', Validators.required],
            systemAdmin: ['', Validators.required]
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect<any>(localStorage.getItem('session')).toBe(
            JSON.stringify(TestConfig.CurrentSession)
        );
        expect(component).toBeTruthy();
    });

    // todo: should edit the user profile, check the submission and the validation of the form
});
