import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDividerModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatButtonModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiAuthenticationModule } from '@knora/authentication';
import { KuiCoreConfig, KuiCoreConfigToken } from '@knora/core';
import { GridComponent } from './grid/grid.component';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MainComponent, GridComponent],
            imports: [
                KuiActionModule,
                KuiAuthenticationModule,
                MatButtonModule,
                MatIconModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDividerModule,
                RouterTestingModule
            ],
            providers: [
                {
                    provide: KuiCoreConfigToken,
                    useValue: KuiCoreConfig
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
