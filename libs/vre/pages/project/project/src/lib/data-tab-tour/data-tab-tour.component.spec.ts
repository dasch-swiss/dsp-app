import { Component, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DataTabTourComponent, DataTabTourStep } from './data-tab-tour.component';
import { DATA_TAB_TOUR_STORAGE_KEY } from './data-tab-tour.service';

@Component({
  template: `
    <button #first>first</button>
    @if (showSecond) {
      <button #second>second</button>
    }
    <app-data-tab-tour [steps]="steps()" />
  `,
  imports: [DataTabTourComponent],
})
class HostComponent {
  showSecond = true;
  private readonly _first = viewChild('first', { read: ElementRef });
  private readonly _second = viewChild('second', { read: ElementRef });
  readonly tour = viewChild.required(DataTabTourComponent);

  steps = (): DataTabTourStep[] => [
    { anchor: this._first(), align: 'start', titleKey: 'one.title', bodyKey: 'one.body' },
    { anchor: this._second(), align: 'end', titleKey: 'two.title', bodyKey: 'two.body' },
  ];
}

describe('DataTabTourComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  const bubble = () => document.querySelector('[data-cy="data-tab-tour"]');
  const click = (cy: string) => (document.querySelector(`[data-cy="${cy}"]`) as HTMLElement).click();

  const render = async (showSecond = true) => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.showSecond = showSecond;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => localStorage.clear());

  it('opens on the first step when the tour has not been seen', async () => {
    await render();

    expect(bubble()?.textContent).toContain('one.title');
    expect(document.querySelector('[data-cy="data-tab-tour-skip"]')).not.toBeNull();
  });

  it('stays closed once the tour has been seen', async () => {
    localStorage.setItem(DATA_TAB_TOUR_STORAGE_KEY, 'x');

    await render();

    expect(bubble()).toBeNull();
  });

  it('walks forward and back between steps', async () => {
    await render();

    click('data-tab-tour-next');
    fixture.detectChanges();
    expect(bubble()?.textContent).toContain('two.title');
    expect(document.querySelector('[data-cy="data-tab-tour-back"]')).not.toBeNull();

    click('data-tab-tour-back');
    fixture.detectChanges();
    expect(bubble()?.textContent).toContain('one.title');
  });

  it('closes and remembers it after the last step', async () => {
    await render();

    click('data-tab-tour-next');
    fixture.detectChanges();
    click('data-tab-tour-next');
    fixture.detectChanges();

    expect(bubble()).toBeNull();
    expect(localStorage.getItem(DATA_TAB_TOUR_STORAGE_KEY)).not.toBeNull();
  });

  it('remembers it when skipped on the first step', async () => {
    await render();

    click('data-tab-tour-skip');
    fixture.detectChanges();

    expect(bubble()).toBeNull();
    expect(localStorage.getItem(DATA_TAB_TOUR_STORAGE_KEY)).not.toBeNull();
  });

  it('closes and remembers it on Escape', async () => {
    await render();

    bubble()!.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27, key: 'Escape', bubbles: true } as any));
    fixture.detectChanges();

    expect(bubble()).toBeNull();
    expect(localStorage.getItem(DATA_TAB_TOUR_STORAGE_KEY)).not.toBeNull();
  });

  it('stays closed when the browser blocks storage', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    await render();

    expect(bubble()).toBeNull();
    jest.restoreAllMocks();
  });

  it('skips a step whose anchor is not on the page', async () => {
    await render(false);

    expect(bubble()?.textContent).toContain('one.title');
    click('data-tab-tour-next');
    fixture.detectChanges();

    expect(bubble()).toBeNull();
  });
});
