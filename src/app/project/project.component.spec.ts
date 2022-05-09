import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection, MockProjects, ProjectResponse, ReadProject } from '@dasch-swiss/dsp-js';
import { of } from 'rxjs';
import { TestConfig } from 'test.config';
import { AppInitService } from '../app-init.service';
import { CacheService } from '../main/cache/cache.service';
import { DspApiConfigToken, DspApiConnectionToken } from '../main/declarations/dsp-api-tokens';
import { DialogComponent } from '../main/dialog/dialog.component';
import { StatusComponent } from '../main/status/status.component';
import { ProjectComponent } from './project.component';

describe('ProjectComponent', () => {
    let component: ProjectComponent;
    let fixture: ComponentFixture<ProjectComponent>;

    beforeEach(waitForAsync(() => {

        const cacheServiceSpy = jasmine.createSpyObj('CacheService', ['get', 'set']);

        TestBed.configureTestingModule({
            declarations: [
                ProjectComponent,
                DialogComponent,
                StatusComponent
            ],
            imports: [
                BrowserAnimationsModule,
                MatDialogModule,
                MatIconModule,
                MatSnackBarModule,
                MatTabsModule,
                RouterTestingModule
            ],
            providers: [
                AppInitService,
                {
                    provide: DspApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: DspApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                },
                {
                    provide: CacheService,
                    useValue: cacheServiceSpy
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {

        // mock cache service
        const cacheSpy = TestBed.inject(CacheService);

        (cacheSpy as jasmine.SpyObj<CacheService>).get.and.callFake(
            () => {
                const response: ProjectResponse = new ProjectResponse();

                const mockProjects = MockProjects.mockProjects();

                response.project = mockProjects.body.projects[0];

                return of(response.project as ReadProject);
            }
        );
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check title, check if we get the shortcode of the current project and valide it, check if get session, get project by shortcode, check if the user is logged in as
    // system admin or project admin
});
