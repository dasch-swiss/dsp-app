import { HttpClientTestingModule } from '@angular/common/http/testing';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectLanguageComponent } from './select-language.component';


describe('SelectLanguageComponent', () => {
    let component: SelectLanguageComponent;
    let fixture: ComponentFixture<SelectLanguageComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SelectLanguageComponent],
            imports: [
                HttpClientTestingModule,
                MatMenuModule,
                TranslateModule.forRoot(),
            ],
            providers: [TranslateService],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SelectLanguageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
