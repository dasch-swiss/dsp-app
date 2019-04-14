import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import {
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { SelectGroupComponent } from 'src/app/project/collaboration/select-group/select-group.component';
import { UsersListComponent } from './users-list/users-list.component';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
    let component: UsersComponent;
    let fixture: ComponentFixture<UsersComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                UsersComponent,
                UsersListComponent,
                SelectGroupComponent
            ],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatChipsModule,
                MatDialogModule,
                MatIconModule,
                MatMenuModule,
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
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UsersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
