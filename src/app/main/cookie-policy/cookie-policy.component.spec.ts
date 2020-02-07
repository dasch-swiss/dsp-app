import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { Location } from '@angular/common';
import { CookiePolicyComponent } from './cookie-policy.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

describe('CookiePolicyComponent', () => {
  let component: CookiePolicyComponent;
  let fixture: ComponentFixture<CookiePolicyComponent>;
  let element: HTMLElement;

  const locationStub = {
    back: jasmine.createSpy('back')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CookiePolicyComponent],
      imports: [
        MatIconModule,
        MatButtonModule,
        MatDividerModule
      ],
      providers: [
        { provide: Location, useValue: locationStub },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CookiePolicyComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement; // the HTML reference
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title "Cookie Policy for Knora web application"', () => {
    const h1 = element.querySelector('h1');
    expect(h1.textContent).toEqual('Cookie Policy for Knora web application');
  });

  it('should have goBack method and should call location.back', inject([Location], (loc: Location) => {
    component.goBack();
    expect(loc.back).toHaveBeenCalledTimes(1);
  }));
});
