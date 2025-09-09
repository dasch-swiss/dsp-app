import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReadUser, User } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserForm } from '@dasch-swiss/vre/pages/user-settings/user';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/string-literal';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CreateUserDialogComponent } from './create-user-dialog.component';

describe('CreateUserDialogComponent', () => {
  let component: CreateUserDialogComponent;
  let fixture: ComponentFixture<CreateUserDialogComponent>;
  let mockDialogRef: jest.Mocked<MatDialogRef<CreateUserDialogComponent>>;
  let mockUserApiService: jest.Mocked<UserApiService>;

  beforeEach(async () => {
    const dialogRefSpy = {
      close: jest.fn(),
    };

    const userApiServiceSpy = {
      create: jest.fn(),
      list: jest.fn().mockReturnValue(of({ users: [] })),
    };

    await TestBed.configureTestingModule({
      declarations: [CreateUserDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        BrowserAnimationsModule,
        TranslateModule.forRoot(),
        HumanReadableErrorPipe,
      ],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: UserApiService, useValue: userApiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateUserDialogComponent);
    component = fixture.componentInstance;
    mockDialogRef = TestBed.inject(MatDialogRef) as any;
    mockUserApiService = TestBed.inject(UserApiService) as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default data', () => {
    expect(component.data).toEqual({
      givenName: '',
      familyName: '',
      email: '',
      username: '',
      lang: 'en',
      isSystemAdmin: false,
    });
    expect(component.isLoading).toBe(false);
  });

  it('should add controls to form when child components initialize', () => {
    const mockUserForm = new FormBuilder().group({
      givenName: [''],
      familyName: [''],
      email: [''],
      username: [''],
      lang: ['en'],
    }) as UserForm;

    const mockPasswordControl = new FormControl<string>('', { nonNullable: true });

    component.afterUserFormInit(mockUserForm);
    component.afterPasswordFormInit(mockPasswordControl);

    expect(component.form.controls.user).toBe(mockUserForm);
    expect(component.form.controls.password).toBe(mockPasswordControl);
  });

  it('should not create user when form is invalid', () => {
    // Initialize form with empty controls that will be invalid
    const mockUserForm = new FormBuilder().group({
      givenName: [
        '',
        [
          /* add required validator to make it invalid */
        ],
      ],
      familyName: [''],
      email: [''],
      username: [''],
      lang: ['en'],
    }) as UserForm;
    const mockPasswordControl = new FormControl<string>('', { nonNullable: true });

    component.afterUserFormInit(mockUserForm);
    component.afterPasswordFormInit(mockPasswordControl);

    // Manually mark form as invalid for testing
    mockUserForm.setErrors({ invalid: true });

    component.createUser();

    expect(mockUserApiService.create).not.toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  });

  it('should create user successfully when form is valid', () => {
    const mockUserForm = new FormBuilder().group({
      givenName: ['John'],
      familyName: ['Doe'],
      email: ['john.doe@example.com'],
      username: ['johndoe'],
      lang: ['en'],
    }) as UserForm;

    const mockPasswordControl = new FormControl<string>('validPassword123', { nonNullable: true });
    const mockResponse = { user: { id: 'user123' } as ReadUser };

    component.ngOnInit();
    component.afterUserFormInit(mockUserForm);
    component.afterPasswordFormInit(mockPasswordControl);
    mockUserApiService.create.mockReturnValue(of(mockResponse));

    component.createUser();

    expect(mockUserApiService.create).toHaveBeenCalledWith(expect.any(User));
    expect(mockDialogRef.close).toHaveBeenCalledWith('user123');
  });
});
