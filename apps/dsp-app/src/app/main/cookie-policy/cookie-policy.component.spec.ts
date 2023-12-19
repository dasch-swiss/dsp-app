import { Location } from '@angular/common';
import { waitForAsync, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CookiePolicyComponent } from './cookie-policy.component';

describe('CookiePolicyComponent', () => {
  let component: CookiePolicyComponent;
  let fixture: ComponentFixture<CookiePolicyComponent>;
  let element: HTMLElement;

  const locationStub = {
    back: jasmine.createSpy('back'),
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CookiePolicyComponent],
      imports: [MatIconModule, MatButtonModule, MatDividerModule],
      providers: [{ provide: Location, useValue: locationStub }],
    }).compileComponents();
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

  it('should display the title "Cookie Policy for DSP-API web application"', () => {
    const h1 = element.querySelector('h1');
    expect(h1.textContent).toEqual('Cookie Policy for DSP-API web application');
  });

  it('should have goBack method and should call location.back', inject([Location], (loc: Location) => {
    component.goBack();
    expect(loc.back).toHaveBeenCalledTimes(1);
  }));
});
