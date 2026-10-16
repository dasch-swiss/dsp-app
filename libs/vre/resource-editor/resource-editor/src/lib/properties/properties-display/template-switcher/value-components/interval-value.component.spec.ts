import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { IntervalValueComponent } from './interval-value.component';

describe('IntervalValueComponent', () => {
  let fixture: ComponentFixture<IntervalValueComponent>;
  let control: FormControl<{ start: number; end: number } | null>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IntervalValueComponent],
      providers: [provideTranslateService()],
    });
    control = new FormControl<{ start: number; end: number } | null>({ start: 1, end: 2 });
    fixture = TestBed.createComponent(IntervalValueComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
  });

  it('syncs parent control changes into the start and end controls', () => {
    control.setValue({ start: 3, end: 4 });

    expect(fixture.componentInstance.startControl.value).toBe(3);
    expect(fixture.componentInstance.endControl.value).toBe(4);
  });

  it('stops listening to the parent control once destroyed', () => {
    const component = fixture.componentInstance;
    fixture.destroy();

    control.setValue({ start: 5, end: 6 });

    expect(component.startControl.value).toBe(1);
    expect(component.endControl.value).toBe(2);
  });
});
