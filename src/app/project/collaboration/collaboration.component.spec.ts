import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import {
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule
} from '@angular/material';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorComponent } from 'src/app/main/error/error.component';
import { UsersListComponent } from 'src/app/system/users/users-list/users-list.component';
import { AddUserComponent } from './add-user/add-user.component';
import { CollaborationComponent } from './collaboration.component';
import { SelectGroupComponent } from './select-group/select-group.component';
import { RouterTestingModule } from '@angular/router/testing';

// TODO: fix test
// TypeError: Cannot read property 'snapshot' of undefined
xdescribe('CollaborationComponent', () => {
    let component: CollaborationComponent;
    let fixture: ComponentFixture<CollaborationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                CollaborationComponent,
                AddUserComponent,
                UsersListComponent,
                SelectGroupComponent,
                ErrorComponent
            ],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatAutocompleteModule,
                MatChipsModule,
                MatIconModule,
                MatInputModule,
                MatMenuModule,
                MatSelectModule,
                ReactiveFormsModule,
                RouterTestingModule,
                TranslateModule.forRoot()
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
        fixture = TestBed.createComponent(CollaborationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
