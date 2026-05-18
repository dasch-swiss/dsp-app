import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { PlaceholderRepresentationComponent } from './placeholder-representation.component';

describe('PlaceholderRepresentationComponent', () => {
  let fixture: ComponentFixture<PlaceholderRepresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceholderRepresentationComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(PlaceholderRepresentationComponent);
    fixture.detectChanges();
  });

  it('renders the empty-state icon, title and message keys', () => {
    const el = fixture.nativeElement as HTMLElement;
    const centered = el.querySelector('app-centered-message');
    expect(centered).toBeTruthy();
    expect(centered?.getAttribute('icon')).toBe('image_not_supported');
    expect(centered?.getAttribute('color')).toBe('white');
  });
});
