import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { provideTranslateService } from '@ngx-translate/core';
import { ResourceLegalLicenseComponent } from './resource-legal-license.component';

describe('ResourceLegalLicenseComponent', () => {
  let component: ResourceLegalLicenseComponent;
  let fixture: ComponentFixture<ResourceLegalLicenseComponent>;

  const ccByLicense: ProjectLicenseDto = {
    id: 'http://rdfh.ch/licenses/cc-by-4.0',
    uri: 'https://creativecommons.org/licenses/by/4.0/',
    labelEn: 'CC BY 4.0',
    isRecommended: true,
    isEnabled: true,
  };

  const unmappedLicense: ProjectLicenseDto = {
    id: 'http://rdfh.ch/licenses/boris',
    uri: 'https://example.com/boris',
    labelEn: 'BORIS Standard License',
    isRecommended: false,
    isEnabled: true,
  };

  const placeholderLicense: ProjectLicenseDto = {
    id: 'urn:placeholder',
    uri: 'urn:placeholder',
    labelEn: 'Placeholder License',
    isRecommended: false,
    isEnabled: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceLegalLicenseComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceLegalLicenseComponent);
    component = fixture.componentInstance;
  });

  function setLicense(license: ProjectLicenseDto | undefined) {
    component.license = license;
    component.ngOnChanges({ license: new SimpleChange(undefined, license, true) });
    fixture.detectChanges();
  }

  it('renders a CC logo link for a mapped license', () => {
    setLicense(ccByLicense);
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('alt')).toBe('license');
  });

  it('renders a text fallback link for an unmapped license', () => {
    setLicense(unmappedLicense);
    expect(fixture.nativeElement.textContent).toContain('BORIS Standard License');
    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.getAttribute('href')).toBe('https://example.com/boris');
  });

  it('renders placeholder chip when license id is the sentinel and skips the external link', () => {
    setLicense(placeholderLicense);
    const chip = fixture.nativeElement.querySelector('[data-cy="placeholder-license"]');
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('urn:placeholder');
  });

  it('renders placeholder chip when license input is undefined', () => {
    setLicense(undefined);
    const chip = fixture.nativeElement.querySelector('[data-cy="placeholder-license"]');
    expect(chip).toBeTruthy();
  });
});
