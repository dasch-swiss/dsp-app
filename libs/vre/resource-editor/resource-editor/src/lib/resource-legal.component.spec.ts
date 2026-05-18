import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceLegalComponent } from './resource-legal.component';

describe('ResourceLegalComponent', () => {
  let component: ResourceLegalComponent;
  let fixture: ComponentFixture<ResourceLegalComponent>;
  let adminApiMock: jest.Mocked<Partial<AdminAPIApiService>>;
  let fetcherMock: jest.Mocked<Partial<ResourceFetcherService>>;

  const realLicense = {
    id: 'http://rdfh.ch/licenses/cc-by-4.0',
    uri: 'https://creativecommons.org/licenses/by/4.0/',
    labelEn: 'CC BY 4.0',
    isRecommended: true,
    isEnabled: true,
  };

  function makeFileValue(overrides: Partial<ReadFileValue> = {}): ReadFileValue {
    return {
      copyrightHolder: 'ACME Inc.',
      authorship: ['Alice', 'Bob'],
      license: { id: realLicense.id } as any,
      ...overrides,
    } as ReadFileValue;
  }

  beforeEach(async () => {
    adminApiMock = {
      getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: jest
        .fn()
        .mockReturnValue(of({ data: [realLicense] })),
    };
    fetcherMock = { projectShortcode$: of('0001') as any };

    await TestBed.configureTestingModule({
      imports: [ResourceLegalComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: AdminAPIApiService, useValue: adminApiMock },
        { provide: ResourceFetcherService, useValue: fetcherMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLegalComponent);
    component = fixture.componentInstance;
  });

  it('renders real copyrightHolder verbatim', () => {
    component.fileValue = makeFileValue();
    fixture.detectChanges();
    const html = fixture.nativeElement.textContent;
    expect(html).toContain('ACME Inc.');
    expect(html).not.toContain('urn:placeholder');
  });

  it('renders placeholder chip when copyrightHolder is the sentinel', () => {
    component.fileValue = makeFileValue({ copyrightHolder: 'urn:placeholder' });
    fixture.detectChanges();
    const placeholderEl = fixture.nativeElement.querySelector('[data-cy="placeholder-copyright-holder"]');
    expect(placeholderEl).toBeTruthy();
    expect(placeholderEl.getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.textContent).not.toContain('urn:placeholder');
  });

  it('renders real authorship list comma-separated', () => {
    component.fileValue = makeFileValue();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
  });

  it('renders placeholder chip when authorship contains the sentinel', () => {
    component.fileValue = makeFileValue({ authorship: ['urn:placeholder'] });
    fixture.detectChanges();
    const placeholderEl = fixture.nativeElement.querySelector('[data-cy="placeholder-authorship"]');
    expect(placeholderEl).toBeTruthy();
    expect(placeholderEl.getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.textContent).not.toContain('urn:placeholder');
  });

  it('renders placeholder chip when authorship is a mixed list containing the sentinel', () => {
    component.fileValue = makeFileValue({ authorship: ['Real Author', 'urn:placeholder'] });
    fixture.detectChanges();
    const placeholderEl = fixture.nativeElement.querySelector('[data-cy="placeholder-authorship"]');
    expect(placeholderEl).toBeTruthy();
    // The placeholder chip replaces the real authors entirely (single-chip semantics).
    expect(fixture.nativeElement.textContent).not.toContain('Real Author');
    expect(fixture.nativeElement.textContent).not.toContain('urn:placeholder');
  });

  it('does NOT fetch licenses when license is the placeholder', () => {
    component.fileValue = makeFileValue({ license: { id: 'urn:placeholder' } as any });
    fixture.detectChanges();
    expect(adminApiMock.getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses).not.toHaveBeenCalled();
  });

  it('does fetch licenses when license is a real IRI', () => {
    component.fileValue = makeFileValue();
    fixture.detectChanges();
    expect(adminApiMock.getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses).toHaveBeenCalled();
  });
});
