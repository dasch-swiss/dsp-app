import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken } from '@knora/core';
import { TestConfig } from 'test.config';
import { AppInitService } from '../app-init.service';
import { FooterComponent } from './footer/footer.component';
import { GridComponent } from './grid/grid.component';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;
    let element: HTMLElement;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MainComponent, FooterComponent, GridComponent],
            imports: [
                KuiActionModule,
                MatButtonModule,
                MatIconModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDividerModule,
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

        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        element = fixture.nativeElement; // the HTML reference
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the title "bring everything together and simplify your research"', () => {
        const h1 = element.querySelector('h1.app-headline');
        expect(h1.textContent).toEqual('bring everything together and simplify your research');
    });

    // to complete:
    /* xit('should display public projects', inject([KnoraApiConnectionToken], (knoraApiConn) => {
        const projectSpy = spyOn(knoraApiConn.admin.projectsEndpoint, 'getProjects').and.callFake(
            () => {
                // TODO: mock data
            });

        expect(component).toBeTruthy();
    })); */

    // todo: it should show the cookie banner, display Accept button, not shown again when clicking (show it once, after clicking, not displayed anymore even when the page is refreshed)
});
