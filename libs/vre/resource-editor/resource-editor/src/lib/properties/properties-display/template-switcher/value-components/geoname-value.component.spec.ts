import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { GeonameService } from '../geoname.service';
import { GeonameValueComponent } from './geoname-value.component';

describe('GeonameValueComponent', () => {
  let fixture: ComponentFixture<GeonameValueComponent>;
  let control: FormControl<string>;
  let searchPlace: jest.Mock;

  beforeEach(() => {
    searchPlace = jest.fn().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [GeonameValueComponent],
      providers: [
        provideTranslateService(),
        provideNoopAnimations(),
        { provide: GeonameService, useValue: { searchPlace, resolveGeonameID: jest.fn() } },
      ],
    });
    control = new FormControl<string>('', { nonNullable: true });
    fixture = TestBed.createComponent(GeonameValueComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
  });

  it('searches places when the parent control changes', fakeAsync(() => {
    control.setValue('Basel');
    tick(300);

    expect(searchPlace).toHaveBeenCalledWith('Basel');
  }));

  it('stops searching once destroyed', fakeAsync(() => {
    fixture.destroy();

    control.setValue('Basel');
    tick(300);

    expect(searchPlace).not.toHaveBeenCalled();
  }));
});
