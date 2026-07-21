import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadRegionPreviewValue } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ResourceFetcherService } from '../../../../representation/resource-fetcher.service';
import { RegionPreviewViewerComponent } from './region-preview-viewer.component';

const fullValue = () =>
  ({
    cropUrl: 'http://sipi/crop.jpg',
    thumbnailUrl: 'http://sipi/thumb.jpg',
    highlightBoxX: 10,
    highlightBoxY: 20,
    highlightBoxW: 30,
    highlightBoxH: 40,
    color: '#00aa00',
    regionIri: 'http://rdfh.ch/0001/region',
    regionLabel: 'A test region',
    fullImageIri: 'http://rdfh.ch/0001/img',
    fullImageLabel: 'Source page 42',
    copyrightHolder: 'DaSCH',
    authorship: ['Ada Lovelace'],
    license: { id: 'http://rdfh.ch/licenses/cc-by-4.0' },
  }) as unknown as ReadRegionPreviewValue;

describe('RegionPreviewViewerComponent', () => {
  let fixture: ComponentFixture<RegionPreviewViewerComponent>;

  const setValue = (value: ReadRegionPreviewValue) => {
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionPreviewViewerComponent],
      providers: [
        provideTranslateService(),
        { provide: ResourceService, useValue: { getResourcePath: jest.fn().mockReturnValue('/project/0001/img') } },
        // app-resource-legal (nested) needs these two or it throws NullInjectorError.
        { provide: ResourceFetcherService, useValue: { projectShortcode$: of('0001') } },
        {
          provide: AdminAPIApiService,
          useValue: {
            getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: jest.fn().mockReturnValue(of({ data: [] })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegionPreviewViewerComponent);
  });

  it('highlights the region by lightening + desaturating the surroundings and revealing the region window', () => {
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;

    const crop = el.querySelector('img.crop') as HTMLImageElement;
    const base = el.querySelector('img.thumb:not(.thumb--region)') as HTMLImageElement;
    const region = el.querySelector('img.thumb--region') as HTMLImageElement;

    expect(crop?.getAttribute('src')).toEqual('http://sipi/crop.jpg');
    expect(base?.getAttribute('src')).toEqual('http://sipi/thumb.jpg');
    // the whole page is lightened + desaturated ...
    expect(base.classList).toContain('thumb--dimmed');
    // ... except the region window, revealed at normal brightness by the clipped overlay of the same page
    expect(region).toBeTruthy();
    expect(region.getAttribute('src')).toEqual('http://sipi/thumb.jpg');
    // inset(top right bottom left): top=Y, right=100-(X+W), bottom=100-(Y+H), left=X
    expect(fixture.componentInstance.regionClip).toEqual('inset(20% 60% 40% 10%)');
  });

  it('renders the thumbnail flat (no dimming, no region overlay) when no rectangle box is served', () => {
    setValue({
      ...fullValue(),
      highlightBoxX: null,
      highlightBoxY: null,
      highlightBoxW: null,
      highlightBoxH: null,
    } as unknown as ReadRegionPreviewValue);
    const el: HTMLElement = fixture.nativeElement;

    const base = el.querySelector('img.thumb') as HTMLImageElement;
    expect(base).toBeTruthy();
    expect(base.classList).not.toContain('thumb--dimmed');
    expect(el.querySelector('img.thumb--region')).toBeNull();
    expect(fixture.componentInstance.regionClip).toBeNull();
  });

  it('shows the region as the emphasized link (to the region page) and the image label as plain context', () => {
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;

    // the region label is the emphasized, navigable target -> region page
    const regionLink = el.querySelector('.cap-region') as HTMLAnchorElement;
    expect(regionLink.textContent?.trim()).toEqual('A test region');
    expect(regionLink.getAttribute('href')).toEqual('/resource/project/0001/img');
    // the image label is subdued, plain context text (not a link)
    const imageLabel = el.querySelector('.cap-image') as HTMLElement;
    expect(imageLabel.textContent?.trim()).toEqual('Source page 42');
    expect(imageLabel.querySelector('a')).toBeNull();
    expect(el.querySelectorAll('.legal-label').length).toBeGreaterThan(1);
  });

  it('on image load failure, hides the images and shows the restricted card with caption + legal still present', () => {
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;

    // dispatching the DOM error event triggers OnPush change detection, like a real Sipi denial
    const crop = el.querySelector('img.crop') as HTMLImageElement;
    crop.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(el.querySelector('img.crop')).toBeNull();
    expect(el.querySelector('img.thumb')).toBeNull();
    expect(el.querySelector('app-alert-info')).toBeTruthy();
    expect(el.querySelector('.cap-link')).toBeTruthy();
    expect(el.querySelectorAll('.legal-label').length).toBeGreaterThan(1);
  });

  it('omits the legal footer when the image has no legal info', () => {
    setValue({
      ...fullValue(),
      copyrightHolder: null,
      authorship: [],
      license: null,
    } as unknown as ReadRegionPreviewValue);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('.legal-label').length).toBe(1);
    // the crop still renders
    expect(el.querySelector('img.crop')).toBeTruthy();
  });

  it('resets the restricted latch and refreshes the legal footer when a new value arrives', () => {
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;

    // first value fails to load -> restricted
    (el.querySelector('img.crop') as HTMLImageElement).dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(el.querySelector('app-alert-info')).toBeTruthy();

    // a new value arrives on the reused instance -> the latch resets and the image is tried again,
    // and the legal footer reflects the new value (here: no legal info -> footer omitted)
    setValue({
      ...fullValue(),
      copyrightHolder: null,
      authorship: [],
      license: null,
    } as unknown as ReadRegionPreviewValue);

    expect(el.querySelector('app-alert-info')).toBeNull();
    expect(el.querySelector('img.crop')).toBeTruthy();
    expect(el.querySelectorAll('.legal-label').length).toBe(1);
  });
});
