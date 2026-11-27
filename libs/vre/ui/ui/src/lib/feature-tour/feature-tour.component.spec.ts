import { Component, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { FEATURE_TOUR_CHANNEL, featureTourStorageKey } from './feature-tour';
import { FeatureTourComponent, FeatureTourStep, FIRST_APPEARANCE_DELAY_MS } from './feature-tour.component';
import { FeatureTourService } from './feature-tour.service';
import { FEATURE_TOURS, FeatureTourName } from './feature-tours';

/** Any registered tour does; the component only reads its name, and each test runs on its live day. */
const NAME = Object.keys(FEATURE_TOURS)[0] as FeatureTourName;
const STORAGE_KEY = featureTourStorageKey(FEATURE_TOURS[NAME]);
const ANOTHER = { id: 'another', liveOn: '2026-12-02' };
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
    <button #third>third</button>
    <app-feature-tour [tour]="name" [steps]="steps()" />
  `,
  imports: [FeatureTourComponent],
})
class HostComponent {
  showSecond = true;
  name = NAME;
  readonly first = viewChild('first', { read: ElementRef });
  private readonly _second = viewChild('second', { read: ElementRef });
  readonly third = viewChild.required('third', { read: ElementRef });
  readonly tour = viewChild.required(FeatureTourComponent);

  steps = (): FeatureTourStep[] => [
    { anchor: this.first(), align: 'start', titleKey: 'one.title', bodyKey: 'one.body' },
    { anchor: this._second(), align: 'end', titleKey: 'two.title', bodyKey: 'two.body' },
  ];
}

/** Hangs `getBoundingClientRect` on an element, which jsdom cannot lay out. */
function placeAt(el: HTMLElement, left: number, top: number, width: number, height: number): void {
  el.getBoundingClientRect = () => new DOMRect(left, top, width, height);
}

describe('FeatureTourComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  const bubble = () => document.querySelector('[data-cy="feature-tour"]');
  const click = (cy: string) => (document.querySelector(`[data-cy="${cy}"]`) as HTMLElement).click();

  /** Renders the host and, unless told otherwise, lets the first-appearance delay run out. */
  const render = async (showSecond = true, waitForTour = true, setUp?: (host: HostComponent) => void) => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTranslateService(), { provide: FEATURE_TOUR_CHANNEL, useValue: 'prod' }],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.showSecond = showSecond;
    setUp?.(fixture.componentInstance);
    fixture.detectChanges();
    // A second pass, as the app runs on its own: it starts the delay, now that the anchors are on the page.
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

  it('counts its delay from when an anchor shows up, not from the first render', async () => {
    await render(false, false, host => {
      host.steps = () => [{ anchor: host['_second'](), align: 'start', titleKey: 't', bodyKey: 'b' }];
    });
    jest.advanceTimersByTime(FIRST_APPEARANCE_DELAY_MS * 5);
    fixture.detectChanges();
    expect(bubble()).toBeNull();

    fixture.componentInstance.showSecond = true;
    fixture.detectChanges();
    fixture.detectChanges();
    jest.advanceTimersByTime(FIRST_APPEARANCE_DELAY_MS - 1);
    fixture.detectChanges();
    expect(bubble()).toBeNull();

    jest.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(bubble()?.textContent).toContain('t');
  });

  it('opens right away when asked to start now', async () => {
    await render(true, false, () => TestBed.inject(FeatureTourService).startNow(FEATURE_TOURS[NAME]));

    expect(bubble()?.textContent).toContain('one.title');
    expect(fixture.componentInstance.tour().captureFocus()).toBe(true);
  });

  it('waits while another tour is on screen, and opens when it closes', async () => {
    await render(true, true, () => TestBed.inject(FeatureTourService).claim(ANOTHER));
    const service = TestBed.inject(FeatureTourService);
    expect(bubble()).toBeNull();

    service.release(ANOTHER);
    fixture.detectChanges();
    expect(bubble()?.textContent).toContain('one.title');
    expect(service.openTour()).toBe(FEATURE_TOURS[NAME].id);

    click('feature-tour-close');
    fixture.detectChanges();
    expect(service.openTour()).toBeNull();
  });

  it('remembers the page was visited, for the teaser', async () => {
    await render(true, false);

    expect(TestBed.inject(FeatureTourService).wasVisited(FEATURE_TOURS[NAME])).toBe(true);
  });

  it('rings several anchors together', async () => {
    await render(false, true, host => {
      host.steps = () => [
        { anchor: [host.first(), undefined, host.third()], align: 'start', titleKey: 't', bodyKey: 'b' },
      ];
    });
    const host = fixture.componentInstance;
    placeAt(host.first()!.nativeElement, 10, 20, 100, 30);
    placeAt(host.third().nativeElement, 200, 40, 50, 30);
    // jsdom has no ResizeObserver to measure again once the anchors are placed.
    host.tour()['_measure']();

    expect(host.tour().spotlightBox()).toEqual({ offsetX: -4, offsetY: -4, width: 248, height: 58 });
  });

  it.each([
    ['below', 'start', { overlayX: 'start', overlayY: 'top', offsetX: -4, offsetY: 44 }],
    ['below', 'end', { overlayX: 'end', overlayY: 'top', offsetX: 104, offsetY: 44 }],
    ['right', 'start', { overlayX: 'start', overlayY: 'top', offsetX: 114, offsetY: -4 }],
    ['right', 'end', { overlayX: 'start', overlayY: 'bottom', offsetX: 114, offsetY: 34 }],
  ] as const)('places the bubble %s the ring, lined up with its %s', async (placement, align, position) => {
    await render(false, true, host => {
      host.steps = () => [{ anchor: host.first(), placement, align, titleKey: 't', bodyKey: 'b' }];
    });
    const host = fixture.componentInstance;
    placeAt(host.first()!.nativeElement, 10, 20, 100, 30);
    host.tour()['_measure']();
    fixture.detectChanges();

    const [preferred, ...fallbacks] = host.tour().bubblePositions();
    expect(preferred).toEqual(expect.objectContaining({ originX: 'start', originY: 'top', ...position }));
    // Beside the anchor falls back to below it on a screen too narrow for both.
    expect(fallbacks.map(fallback => fallback.overlayY)).toEqual(placement === 'right' ? ['top'] : []);
  });
});
