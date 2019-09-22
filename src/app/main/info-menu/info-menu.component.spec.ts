import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { InfoMenuComponent } from './info-menu.component';


describe('InfoMenuComponent', () => {
    let component: InfoMenuComponent;
    let fixture: ComponentFixture<InfoMenuComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [InfoMenuComponent],
            imports: [
                HttpClientTestingModule,
                KuiCoreModule,
                MatButtonModule,
                MatIconModule,
                MatListModule,
                MatMenuModule,
                RouterTestingModule
            ],
            providers: [
                {
                    provide: KuiCoreConfigToken,
                    useValue: KuiCoreConfig
                }
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(InfoMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
