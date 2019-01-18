import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AppModule } from '../../../app.module';


import { UserDataComponent } from './user-data.component';

import { UsersService } from '@knora/core';

describe('UserDataComponent', () => {
    let component: UserDataComponent;
    let fixture: ComponentFixture<UserDataComponent>;

    // const id: string = 'http://rdfh.ch/projects/0803';

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                AppModule
            ],
            providers: [
                UsersService
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UserDataComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit('should create', () => {
        expect(component).toBeTruthy();
    });
});
