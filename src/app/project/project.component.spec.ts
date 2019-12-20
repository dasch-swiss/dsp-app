import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiCoreModule } from '@knora/core';
import { TestConfig } from 'test.config';
import { AppInitService } from '../app-init.service';
import { ErrorComponent } from '../main/error/error.component';
import { ProjectComponent } from './project.component';

describe('ProjectComponent', () => {
    let component: ProjectComponent;
    let fixture: ComponentFixture<ProjectComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ProjectComponent, ErrorComponent],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatIconModule,
                MatTabsModule,
                RouterTestingModule
            ],
            providers: [
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

    beforeEach(() => {
        fixture = TestBed.createComponent(ProjectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
