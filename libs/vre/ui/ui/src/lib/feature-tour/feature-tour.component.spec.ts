import { Component, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { FEATURE_TOUR_CHANNEL, featureTourStorageKey } from './feature-tour';
import { FeatureTourComponent, FeatureTourStep, FIRST_APPEARANCE_DELAY_MS } from './feature-tour.component';
import { FEATURE_TOURS, FeatureTourName } from './feature-tours';

/** Any registered tour does; the component only reads its name, and each test runs on its live day. */
const NAME = Object.keys(FEATURE_TOURS)[0] as FeatureTourName;
const STORAGE_KEY = featureTourStorageKey(FEATURE_TOURS[NAME]);
const LIVE_DAY = (() => {
  const [year, month, day] = FEATURE_TOURS[NAME].liveOn.split('-').map(Number);
  return new Date(year, month - 1, day, 10);
})();

@Component({
  template: `
    <button #first>first</button>
    @if (showSecond) {
      <button #second>second</button>
    }
    <app-feature-tour [tour]="name" [steps]="steps()" />
  `,
  imports: [FeatureTourComponent],
})
class HostComponent {
  showSecond = true;
  name = NAME;
  private readonly _first = viewChild('first', { read: ElementRef });
  private readonly _second = viewChild('second', { read: ElementRef });
  readonly tour = viewChild.required(FeatureTourComponent);

  steps = (): FeatureTourStep[] => [
    { anchor: this._first(), align: 'start', titleKey: 'one.title', bodyKey: 'one.body' },
    { anchor: this._second(), align: 'end', titleKey: 'two.title', bodyKey: 'two.body' },
  ];
}

describe('FeatureTourComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  const bubble = () => document.querySelector('[data-cy="feature-tour"]');
  const click = (cy: string) => (document.querySelector(`[data-cy="${cy}"]`) as HTMLElement).click();

  /** Renders the host and, unless told otherwise, lets the first-appearance delay run out. */
  const render = async (showSecond = true, waitForTour = true) => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTranslateService(), { provide: FEATURE_TOUR_CHANNEL, useValue: 'prod' }],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.showSecond = showSecond;
    fixture.detectChanges();
    if (waitForTour) {
      jest.advanceTimersByTime(FIRST_APPEARANCE_DELAY_MS);
    }
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers({ now: LIVE_DAY });
  });

  afterEach(() => jest.useRealTimers());

  it('opens on the first step when the tour has not been seen', async () => {
    await render();

    expect(bubble()?.textContent).toContain('one.title');
    expect(document.querySelector('[data-cy="feature-tour-back"]')).toBeNull();
  });

  it('waits before it first opens', async () => {
    await render(true, false);
    expect(bubble()).toBeNull();

    jest.advanceTimersByTime(FIRST_APPEARANCE_DELAY_MS - 1);
    fixture.detectChanges();
    expect(bubble()).toBeNull();

    jest.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(bubble()?.textContent).toContain('one.title');
  });

  // The focus trap itself only moves focus to elements it can see, which jsdom cannot lay out, so
  // these check the decision the trap is given rather than where focus ends up.
  it('does not take focus when the user is already in a page control', async () => {
    await render(true, false);
    (document.querySelector('button') as HTMLButtonElement).focus();

    jest.advanceTimersByTime(FIRST_APPEARANCE_DELAY_MS);
    fixture.detectChanges();

    expect(bubble()).not.toBeNull();
    expect(fixture.componentInstance.tour().captureFocus()).toBe(false);
  });

  it('takes focus when nothing on the page has it', async () => {
    await render();

    expect(fixture.componentInstance.tour().captureFocus()).toBe(true);
  });

  it('stays closed once the tour has been seen', async () => {
    localStorage.setItem(STORAGE_KEY, 'x');

    await render();

    expect(bubble()).toBeNull();
  });

  it('walks forward and back between steps', async () => {
    await render();

    click('feature-tour-next');
    fixture.detectChanges();
    expect(bubble()?.textContent).toContain('two.title');
    expect(document.querySelector('[data-cy="feature-tour-back"]')).not.toBeNull();

    click('feature-tour-back');
    fixture.detectChanges();
    expect(bubble()?.textContent).toContain('one.title');
  });

  it('closes and remembers it after the last step', async () => {
    await render();

    click('feature-tour-next');
    fixture.detectChanges();
    click('feature-tour-next');
    fixture.detectChanges();

    expect(bubble()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('closes and remembers it from the close button', async () => {
    await render();

    click('feature-tour-close');
    fixture.detectChanges();

    expect(bubble()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('closes and remembers it on Escape', async () => {
    await render();

    bubble()!.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27, key: 'Escape', bubbles: true } as any));
    fixture.detectChanges();

    expect(bubble()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
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
    click('feature-tour-next');
    fixture.detectChanges();

    expect(bubble()).toBeNull();
  });
});
