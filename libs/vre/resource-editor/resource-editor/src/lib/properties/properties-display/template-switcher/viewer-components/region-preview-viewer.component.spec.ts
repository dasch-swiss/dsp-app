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

  it('renders the crop, the thumbnail, and the highlight box positioned from the served percentages', () => {
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;

    const crop = el.querySelector('img.crop') as HTMLImageElement;
    const thumb = el.querySelector('img.thumb') as HTMLImageElement;
    const box = el.querySelector('.highlight') as HTMLElement;

    expect(crop?.getAttribute('src')).toEqual('http://sipi/crop.jpg');
    expect(thumb?.getAttribute('src')).toEqual('http://sipi/thumb.jpg');
    expect(box).toBeTruthy();
    expect(box.style.left).toEqual('10%');
    expect(box.style.top).toEqual('20%');
    expect(box.style.width).toEqual('30%');
    expect(box.style.height).toEqual('40%');
  });

  it('shows the caption + navigate link and the legal footer', () => {
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;

    const captionLink = el.querySelector('.caption a') as HTMLAnchorElement;
    expect(captionLink.textContent?.trim()).toEqual('Source page 42');
    expect(captionLink.getAttribute('href')).toEqual('/resource/project/0001/img');
    expect(el.querySelector('.legal')).toBeTruthy();
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
    expect(el.querySelector('.caption')).toBeTruthy();
    expect(el.querySelector('.legal')).toBeTruthy();
  });

  it('omits the legal footer when the image has no legal info', () => {
    setValue({
      ...fullValue(),
      copyrightHolder: null,
      authorship: [],
      license: null,
    } as unknown as ReadRegionPreviewValue);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.legal')).toBeNull();
    // the crop still renders
    expect(el.querySelector('img.crop')).toBeTruthy();
  });

  it('renders the "cannot be displayed" placeholder (not the restricted banner, not an <img>) when there is no crop', () => {
    setValue({ ...fullValue(), cropUrl: null } as unknown as ReadRegionPreviewValue);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('app-centered-message')).toBeTruthy();
    expect(el.querySelector('app-alert-info')).toBeNull();
    expect(el.querySelector('img.crop')).toBeNull();
    expect(el.querySelector('img.thumb')).toBeNull();
    // caption + legal still render
    expect(el.querySelector('.caption')).toBeTruthy();
    expect(el.querySelector('.legal')).toBeTruthy();
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
    expect(el.querySelector('.legal')).toBeNull();
  });
});
