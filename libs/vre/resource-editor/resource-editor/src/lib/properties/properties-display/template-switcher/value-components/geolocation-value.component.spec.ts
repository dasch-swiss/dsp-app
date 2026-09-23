import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { CRS_84, GeolocationFormValue } from './geolocation-crs';
import { GeolocationValueComponent } from './geolocation-value.component';

describe('GeolocationValueComponent', () => {
  let fixture: ComponentFixture<GeolocationValueComponent>;
  let control: FormControl<GeolocationFormValue | null>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeolocationValueComponent],
      providers: [provideTranslateService(), provideNoopAnimations()],
    });
    control = new FormControl<GeolocationFormValue | null>({ crs: CRS_84.iri, x: '8.5', y: '47.3' });
    fixture = TestBed.createComponent(GeolocationValueComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
  });

  it('syncs parent control changes into the coordinate controls', () => {
    control.setValue({ crs: CRS_84.iri, x: '7.4', y: '46.9' });

    expect(fixture.componentInstance.xControl.value).toBe('7.4');
    expect(fixture.componentInstance.yControl.value).toBe('46.9');
  });

  it('stops listening to the parent control once destroyed', () => {
    const component = fixture.componentInstance;
    fixture.destroy();

    control.setValue({ crs: CRS_84.iri, x: '7.4', y: '46.9' });

    expect(component.xControl.value).toBe('8.5');
    expect(component.yControl.value).toBe('47.3');
  });
});
