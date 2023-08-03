import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppDatePickerComponent } from './app-date-picker/app-date-picker.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { Subject } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatOptionModule,
        MatMenuModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatSelectModule,
    ],
    declarations: [AppDatePickerComponent],
    providers: [Subject],
    exports: [AppDatePickerComponent],
})
export class AppDatePickerModule {}
