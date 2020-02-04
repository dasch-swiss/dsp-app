import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KnoraApiConnection } from '@knora/api';
import { KnoraApiConfigToken, KnoraApiConnectionToken, KuiConfigToken, KuiConfig } from '@knora/core';
import { AppInitService } from 'src/app/app-init.service';
import { TestConfig } from 'test.config';
import { FooterComponent } from '../footer/footer.component';
import { GridComponent } from '../grid/grid.component';
import { HelpComponent } from './help.component';

describe('HelpComponent', () => {
    let component: HelpComponent;
    let fixture: ComponentFixture<HelpComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HelpComponent, FooterComponent, GridComponent],
            imports: [
                HttpClientTestingModule,
                MatButtonModule,
                MatIconModule,
                RouterTestingModule
            ],
            providers: [
                AppInitService,
                {
                    provide: KuiConfigToken,
                    useValue: new KuiConfig(TestConfig.ApiConfig, TestConfig.AppConfig)
                },
                {
                    provide: KnoraApiConfigToken,
                    useValue: TestConfig.ApiConfig
                },
                {
                    provide: KnoraApiConnectionToken,
                    useValue: new KnoraApiConnection(TestConfig.ApiConfig)
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HelpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // todo: check links, check knora versions
});
