import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConfigToken, DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { StatusComponent } from '@dsp-app/src/app/main/status/status.component';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { TestConfig } from '@dsp-app/src/test.config';
import { TranslateModule } from '@ngx-translate/core';
import { AddUserComponent } from './add-user.component';

describe('AddUserComponent', () => {
  let component: AddUserComponent;
  let fixture: ComponentFixture<AddUserComponent>;

  const appInitSpy = {
    dspAppConfig: {
      iriBase: 'http://rdfh.ch',
    },
  };

  const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['uuidToIri']);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddUserComponent, DialogComponent, StatusComponent],
      imports: [
        BrowserAnimationsModule,
        MatAutocompleteModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        {
          provide: AppConfigService,
          useValue: appInitSpy,
        },
        {
          provide: ProjectService,
          useValue: projectServiceSpy,
        },
        {
          provide: DspApiConfigToken,
          useValue: TestConfig.ApiConfig,
        },
        {
          provide: DspApiConnectionToken,
          useValue: new KnoraApiConnection(TestConfig.ApiConfig),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });

  // todo: check todo list of collaboration component
});
