import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadRegionPreviewValue } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { PLACEHOLDER_FILE_SENTINEL } from '../../../../representation/is-placeholder-file-value';
import { RepresentationService } from '../../../../representation/representation.service';
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
  let representationService: { getImageBlob: jest.Mock };

  const setValue = (value: ReadRegionPreviewValue) => {
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    // jsdom implements neither, and the component creates/revokes blob URLs for the fetched images.
    URL.createObjectURL = jest.fn().mockReturnValue('blob:mock');
    URL.revokeObjectURL = jest.fn();
    // Default: the authenticated crop/thumbnail fetch succeeds (the images are viewable).
    representationService = { getImageBlob: jest.fn().mockReturnValue(of(new Blob())) };

    await TestBed.configureTestingModule({
      imports: [RegionPreviewViewerComponent],
      providers: [
        provideTranslateService(),
        { provide: ResourceService, useValue: { getResourcePath: jest.fn().mockReturnValue('/project/0001/img') } },
        { provide: RepresentationService, useValue: representationService },
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

  // DEV-6982: dsp-tools writes the sentinel into the legal fields when the real legal info is not
  // known yet; the overlay must show the readable marker, never the raw URN.
  describe('placeholder legal values', () => {
    const placeholderValue = () =>
      ({
        ...(fullValue() as unknown as Record<string, unknown>),
        copyrightHolder: PLACEHOLDER_FILE_SENTINEL,
        authorship: [PLACEHOLDER_FILE_SENTINEL],
        license: { id: PLACEHOLDER_FILE_SENTINEL },
      }) as unknown as ReadRegionPreviewValue;

    const withPlaceholderLicenseAvailable = async () => {
      // The component resolves the license IRI against the project license list, so the placeholder
      // license must be present there for the license row to render at all.
      TestBed.resetTestingModule();
      URL.createObjectURL = jest.fn().mockReturnValue('blob:mock');
      URL.revokeObjectURL = jest.fn();
      await TestBed.configureTestingModule({
        imports: [RegionPreviewViewerComponent],
        providers: [
          provideTranslateService(),
          { provide: ResourceService, useValue: { getResourcePath: jest.fn().mockReturnValue('/project/0001/img') } },
          { provide: RepresentationService, useValue: { getImageBlob: jest.fn().mockReturnValue(of(new Blob())) } },
          { provide: ResourceFetcherService, useValue: { projectShortcode$: of('0001') } },
          {
            provide: AdminAPIApiService,
            useValue: {
              getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: jest.fn().mockReturnValue(
                of({
                  data: [
                    {
                      id: PLACEHOLDER_FILE_SENTINEL,
                      uri: PLACEHOLDER_FILE_SENTINEL,
                      labelEn:
                        'Placeholder License - Not a Real License only to be used when the real license is not known yet.',
                    },
                  ],
                })
              ),
            },
          },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(RegionPreviewViewerComponent);
      fixture.componentRef.setInput('value', placeholderValue());
      fixture.detectChanges();
    };

    it('never renders the raw sentinel for copyright holder or authorship', () => {
      setValue(placeholderValue());
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).not.toContain(PLACEHOLDER_FILE_SENTINEL);
      // The i18n key resolves to itself with no loaded bundle, which is how we know the marker was used.
      expect(text).toContain('resourceEditor.legal.placeholder');
    });

    it('renders the placeholder license as a non-link pill, since its uri is not dereferenceable', async () => {
      await withPlaceholderLicenseAvailable();
      const el: HTMLElement = fixture.nativeElement;

      const staticPill = el.querySelector('span.license-pill');
      expect(staticPill).not.toBeNull();
      expect(staticPill!.classList).toContain('license-pill--static');
      // No anchor may point at the sentinel.
      expect(el.querySelector(`a[href="${PLACEHOLDER_FILE_SENTINEL}"]`)).toBeNull();
      expect(el.textContent).not.toContain('Not a Real License');
    });

    it('keeps real legal values untouched', () => {
      setValue(fullValue());
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('DaSCH');
      expect(text).toContain('Ada Lovelace');
      expect(text).not.toContain('resourceEditor.legal.placeholder');
    });
  });

  it('highlights the region by lightening + desaturating the surroundings and revealing the region window', () => {
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;

    const crop = el.querySelector('img.crop') as HTMLImageElement;
    const base = el.querySelector('img.thumb:not(.thumb--region)') as HTMLImageElement;
    const region = el.querySelector('img.thumb--region') as HTMLImageElement;

    // the crop/thumbnail are fetched with the JWT (a bare <img> can't) and shown via a blob: URL
    expect(representationService.getImageBlob).toHaveBeenCalledWith('http://sipi/crop.jpg');
    expect(representationService.getImageBlob).toHaveBeenCalledWith('http://sipi/thumb.jpg');
    expect(crop?.getAttribute('src')).toEqual('blob:mock');
    expect(base?.getAttribute('src')).toEqual('blob:mock');
    // the whole page is lightened + desaturated ...
    expect(base.classList).toContain('thumb--dimmed');
    // ... except the region window, revealed at normal brightness by the clipped overlay of the same page
    expect(region).toBeTruthy();
    expect(region.getAttribute('src')).toEqual('blob:mock');
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

  it('on image fetch failure, hides the images and shows the restricted card with caption + legal still present', () => {
    // Sipi denies the pixels for a resource this user can't view -> the authenticated fetch errors
    representationService.getImageBlob.mockReturnValue(throwError(() => ({ status: 403 })));
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('img.crop')).toBeNull();
    expect(el.querySelector('img.thumb')).toBeNull();
    expect(el.querySelector('app-alert-info')).toBeTruthy();
    expect(el.querySelector('.cap-link')).toBeTruthy();
    expect(el.querySelectorAll('.legal-label').length).toBeGreaterThan(1);
  });

  it('shows "Not specified" for every legal field when the image has no legal info', () => {
    setValue({
      ...fullValue(),
      copyrightHolder: null,
      authorship: [],
      license: null,
    } as unknown as ReadRegionPreviewValue);
    const el: HTMLElement = fixture.nativeElement;

    // caption + copyright holder + authorship + license
    expect(el.querySelectorAll('.legal-label').length).toBe(4);
    expect((el.textContent ?? '').match(/resourceEditor\.legal\.notSpecified/g)?.length).toBe(3);
    // the crop still renders
    expect(el.querySelector('img.crop')).toBeTruthy();
  });

  it('resets the restricted latch and refreshes the legal footer when a new value arrives', () => {
    // first value fails to load -> restricted
    representationService.getImageBlob.mockReturnValue(throwError(() => ({ status: 403 })));
    setValue(fullValue());
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-alert-info')).toBeTruthy();

    // a new value arrives on the reused instance -> the latch resets and the image is fetched again
    // (now viewable), and the legal footer reflects the new value (here: no legal info -> "Not specified")
    representationService.getImageBlob.mockReturnValue(of(new Blob()));
    setValue({
      ...fullValue(),
      copyrightHolder: null,
      authorship: [],
      license: null,
    } as unknown as ReadRegionPreviewValue);

    expect(el.querySelector('app-alert-info')).toBeNull();
    expect(el.querySelector('img.crop')).toBeTruthy();
    expect((el.textContent ?? '').match(/resourceEditor\.legal\.notSpecified/g)?.length).toBe(3);
  });
});
