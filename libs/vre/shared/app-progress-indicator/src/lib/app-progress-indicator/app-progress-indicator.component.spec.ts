import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppProgressIndicatorComponent } from './app-progress-indicator.component';

describe('AppProgressIndicatorComponent', () => {
    let component: AppProgressIndicatorComponent;
    let fixture: ComponentFixture<AppProgressIndicatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
        }).compileComponents();


        fixture = TestBed.createComponent(AppProgressIndicatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
