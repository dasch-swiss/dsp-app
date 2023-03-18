import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { RouterTestingModule } from '@angular/router/testing';

import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
    let component: SettingsComponent;
    let fixture: ComponentFixture<SettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SettingsComponent],
            imports: [
                MatIconModule,
                MatTabsModule,
                RouterTestingModule
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
