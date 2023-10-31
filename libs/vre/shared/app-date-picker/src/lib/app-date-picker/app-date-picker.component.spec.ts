import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppDatePickerComponent } from './app-date-picker.component'
import { Subject } from 'rxjs';

describe('DatePickerComponent', () => {
    let component: AppDatePickerComponent;
    let fixture: ComponentFixture<AppDatePickerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                AppDatePickerComponent,
                BrowserAnimationsModule,
                MatButtonModule,
                MatButtonToggleModule,
                MatFormFieldModule,
                MatInputModule,
                MatIconModule,
                MatMenuModule,
                MatSelectModule,
                ReactiveFormsModule,
            ],
            providers: [Subject],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppDatePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
