import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { FEATURE_TOUR_CHANNEL } from './feature-tour';
import { FeatureTourTeaserComponent, TEASER_CLOSE_GRACE_MS } from './feature-tour-teaser.component';
import { FEATURE_TOURS_OFF_STORAGE_KEY, FeatureTourService } from './feature-tour.service';
import { FEATURE_TOURS } from './feature-tours';

const TOUR = FEATURE_TOURS.dataModels;
const LIVE_DAY = (() => {
  const [year, month, day] = TOUR.liveOn.split('-').map(Number);
  return new Date(year, month - 1, day, 10);
})();

@Component({
  template: `
    <a href="/elsewhere" (click)="followed = true" (keydown)="keyed = true">
      <span style="position: relative">
        Tab
        <app-feature-tour-teaser
          tour="dataModels"
          labelKey="label"
          titleKey="title"
          bodyKey="body"
          (started)="started = true" />
      </span>
    </a>
  `,
  imports: [FeatureTourTeaserComponent],
})
class HostComponent {
  followed = false;
  keyed = false;
  started = false;
}

describe('FeatureTourTeaserComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let tours: FeatureTourService;

  const label = () => document.querySelector<HTMLButtonElement>('[data-cy="feature-tour-teaser"]');
  const popover = () => document.querySelector('[data-cy="feature-tour-teaser-popover"]');
  const fire = (el: Element | null, type: string) => {
    el!.dispatchEvent(new Event(type));
    fixture.detectChanges();
  };
  /** A pointer click, which `HTMLElement.click()` is not: that one reads as a key press (`detail` 0). */
  const mouseClick = (el: Element | null) => {
    el!.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };
  const click = (cy: string) => {
    document.querySelector<HTMLElement>(`[data-cy="${cy}"]`)!.click();
    fixture.detectChanges();
  };
  const key = (el: Element | null, keyCode: number, k: string) => {
    el!.dispatchEvent(new KeyboardEvent('keydown', { keyCode, key: k, bubbles: true } as KeyboardEventInit));
    fixture.detectChanges();
  };

  const render = async (setUp?: () => void) => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTranslateService(), { provide: FEATURE_TOUR_CHANNEL, useValue: 'prod' }],
    }).compileComponents();
    tours = TestBed.inject(FeatureTourService);
    setUp?.();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers({ now: LIVE_DAY });
  });

  afterEach(() => jest.useRealTimers());

  it('shows the label, closed, while the tour would show and its page was not visited', async () => {
    await render();

    expect(label()?.getAttribute('aria-label')).toBe('label');
    expect(label()?.getAttribute('aria-expanded')).toBe('false');
    expect(popover()).toBeNull();
  });

  it.each([
    ['the tour page was visited', () => tours.markVisited(TOUR)],
    ['the tour was seen', () => tours.markSeen(TOUR)],
    ['tours are turned off', () => localStorage.setItem(FEATURE_TOURS_OFF_STORAGE_KEY, 'e2e')],
  ])('is not shown once %s', async (_, setUp) => {
    await render(setUp);

    expect(label()).toBeNull();
  });

  it('is not shown before the tour goes live', async () => {
    jest.setSystemTime(new Date(LIVE_DAY.getTime() - 24 * 60 * 60 * 1000));

    await render();

    expect(label()).toBeNull();
  });

  it('goes away as soon as the tour page is visited', async () => {
    await render();

    tours.markVisited(TOUR);
    fixture.detectChanges();

    expect(label()).toBeNull();
  });

  it('opens on hover and closes a grace period after the pointer leaves', async () => {
    await render();

    fire(label(), 'pointerenter');
    expect(popover()).not.toBeNull();
    expect(label()?.getAttribute('aria-expanded')).toBe('true');

    fire(label(), 'pointerleave');
    jest.advanceTimersByTime(TEASER_CLOSE_GRACE_MS - 1);
    fixture.detectChanges();
    expect(popover()).not.toBeNull();

    jest.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(popover()).toBeNull();
  });

  it('stays open once the pointer moves into the popover', async () => {
    await render();

    fire(label(), 'pointerenter');
    fire(label(), 'pointerleave');
    fire(popover()!.parentElement, 'pointerenter');
    fire(popover()!.parentElement, 'pointerleave');
    jest.advanceTimersByTime(TEASER_CLOSE_GRACE_MS * 2);
    fixture.detectChanges();

    expect(popover()).not.toBeNull();
  });

  it('stays open once clicked, without following the link it sits in', async () => {
    await render();

    fire(label(), 'pointerenter');
    mouseClick(label());
    fire(label(), 'pointerleave');
    jest.advanceTimersByTime(TEASER_CLOSE_GRACE_MS * 2);
    fixture.detectChanges();

    expect(popover()).not.toBeNull();
    expect(fixture.componentInstance.followed).toBe(false);

    mouseClick(label());
    expect(popover()).toBeNull();
  });

  it('takes focus only when opened from the keyboard', async () => {
    await render();
    const teaser = fixture.debugElement.query(By.directive(FeatureTourTeaserComponent))
      .componentInstance as FeatureTourTeaserComponent;

    click('feature-tour-teaser');
    expect(teaser.focusOnOpen()).toBe(true);

    key(popover(), 27, 'Escape');
    fire(label(), 'pointerenter');
    expect(popover()).not.toBeNull();
    expect(teaser.focusOnOpen()).toBe(false);
  });

  it('keeps Enter and Space from the link, and closes on Escape', async () => {
    await render();

    key(label(), 13, 'Enter');
    key(label(), 32, ' ');
    expect(fixture.componentInstance.keyed).toBe(false);

    click('feature-tour-teaser');
    key(popover(), 27, 'Escape');
    expect(popover()).toBeNull();
    expect(label()).not.toBeNull();
  });

  it('closes only the popover from its close button', async () => {
    await render();

    click('feature-tour-teaser');
    click('feature-tour-teaser-close');

    expect(popover()).toBeNull();
    expect(label()).not.toBeNull();
    expect(tours.shouldShow(TOUR)).toBe(true);
  });

  it('turns off the label, its tour and the tours that follow it on "No thanks"', async () => {
    await render();

    click('feature-tour-teaser');
    click('feature-tour-teaser-dismiss');

    expect(label()).toBeNull();
    expect(popover()).toBeNull();
    expect(tours.shouldShow(TOUR)).toBe(false);
    expect(tours.shouldShow(FEATURE_TOURS.dataModelsDiagram)).toBe(false);
  });

  it('asks the host to go to the tour, and the tour to skip its delay, on "Start tour"', async () => {
    await render();

    click('feature-tour-teaser');
    click('feature-tour-teaser-start');

    expect(fixture.componentInstance.started).toBe(true);
    expect(popover()).toBeNull();
    expect(tours.takeStartNow(TOUR)).toBe(true);
    expect(tours.shouldShow(TOUR)).toBe(true);
  });
});
