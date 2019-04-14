import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiAuthenticationModule } from '@knora/authentication';
import { KuiCoreConfig, KuiCoreConfigToken } from '@knora/core';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MainComponent],
            imports: [KuiAuthenticationModule, RouterTestingModule],
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
