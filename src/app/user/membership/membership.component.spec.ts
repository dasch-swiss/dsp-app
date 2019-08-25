import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatDividerModule, MatIconModule, MatListModule, MatSelectModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { MembershipComponent } from './membership.component';

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
                MatButtonModule,
                MatDividerModule,
                MatIconModule,
                MatListModule,
                MatSelectModule,
                ReactiveFormsModule,
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
