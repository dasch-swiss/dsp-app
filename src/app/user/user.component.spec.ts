import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import {
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatTabsModule
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { KuiActionModule } from '@knora/action';
import { KuiCoreConfig, KuiCoreConfigToken, KuiCoreModule } from '@knora/core';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorComponent } from '../main/error/error.component';
import { ProjectsListComponent } from '../system/projects/projects-list/projects-list.component';
import { ProjectsComponent } from '../system/projects/projects.component';
import { AccountComponent } from './account/account.component';
import { CollectionListComponent } from './collection-list/collection-list.component';
import { ProfileComponent } from './profile/profile.component';
import { UserPasswordComponent } from './user-form/user-password/user-password.component';
import { UserComponent } from './user.component';

// TODO: fix test
// TypeError: Cannot read property 'snapshot' of undefined
xdescribe('UserComponent', () => {
    let component: UserComponent;
    let fixture: ComponentFixture<UserComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                UserComponent,
                ErrorComponent,
                ProfileComponent,
                AccountComponent,
                ProjectsComponent,
                ProjectsListComponent,
                CollectionListComponent,
                UserPasswordComponent
            ],
            imports: [
                KuiActionModule,
                KuiCoreModule,
                MatButtonModule,
                MatDialogModule,
                MatDividerModule,
                MatFormFieldModule,
                MatIconModule,
                MatInputModule,
                MatMenuModule,
                MatTabsModule,
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
        fixture = TestBed.createComponent(UserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
