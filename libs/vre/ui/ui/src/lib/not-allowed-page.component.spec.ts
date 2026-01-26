import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { NotAllowedPageComponent } from './not-allowed-page.component';

describe('NotAllowedPageComponent', () => {
  let component: NotAllowedPageComponent;
  let fixture: ComponentFixture<NotAllowedPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotAllowedPageComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService(), TranslateService],
    })
      .overrideComponent(NotAllowedPageComponent, {
        set: {
          template: '<div>Mock Template</div>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NotAllowedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
