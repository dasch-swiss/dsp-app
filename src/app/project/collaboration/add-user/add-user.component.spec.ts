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
import { TranslateModule } from '@ngx-translate/core';
import { AppInitService } from 'src/app/app-init.service';
import { DspApiConfigToken, DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { StatusComponent } from 'src/app/main/status/status.component';
import { ProjectService } from 'src/app/workspace/resource/services/project.service';
import { TestConfig } from 'test.config';
import { AddUserComponent } from './add-user.component';

describe('AddUserComponent', () => {
    let component: AddUserComponent;
    let fixture: ComponentFixture<AddUserComponent>;

    const appInitSpy = {
        dspAppConfig: {
            iriBase: 'http://rdfh.ch'
        }
    };

    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['uuidToIri']);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                AddUserComponent,
                DialogComponent,
                StatusComponent
            ],
            imports: [
                BrowserAnimationsModule,
                MatAutocompleteModule,
                MatDialogModule,
                MatIconModule,
                MatInputModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
            ],
            providers: [
                {
                    provide: AppInitService,
                    useValue: appInitSpy
                },
                {
                    provide: ProjectService,
                    useValue: projectServiceSpy
                },
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
