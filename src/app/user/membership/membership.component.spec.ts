import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule, MatListModule } from '@angular/material';
import { KuiActionModule } from '@knora/action';
import { KuiCoreModule, KuiCoreConfigToken, KuiCoreConfig } from '@knora/core';
import { MembershipComponent } from './membership.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('MembershipComponent', () => {
    let component: MembershipComponent;
    let fixture: ComponentFixture<MembershipComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                MembershipComponent
            ],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatIconModule,
                MatListModule,
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
        fixture = TestBed.createComponent(MembershipComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
