import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { TranslateModule } from '@ngx-translate/core';
import { LicenseToggleEvent, LicensesEnabledTableComponent } from './licenses-enabled-table.component';

describe('LicensesEnabledTableComponent - Event-Driven Architecture', () => {
  let component: LicensesEnabledTableComponent;
  let fixture: ComponentFixture<LicensesEnabledTableComponent>;

  const mockProject = {
    shortcode: '0001',
  } as ReadProject;

  const mockLicenses: ProjectLicenseDto[] = [
    {
      id: 'http://creativecommons.org/licenses/by/4.0/',
      labelEn: 'CC BY 4.0',
      uri: 'http://creativecommons.org/licenses/by/4.0/',
      isEnabled: false,
      isRecommended: true,
    },
    {
      id: 'http://creativecommons.org/licenses/by-sa/4.0/',
      labelEn: 'CC BY-SA 4.0',
      uri: 'http://creativecommons.org/licenses/by-sa/4.0/',
      isEnabled: true,
      isRecommended: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LicensesEnabledTableComponent, TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LicensesEnabledTableComponent);
    component = fixture.componentInstance;
    component.project = mockProject;
    component.licenses = [...mockLicenses];
  });

  describe('onLicenseToggle', () => {
    it('should emit licenseToggle event when checkbox is checked', () => {
      const license = component.licenses[0];
      const event = {
        checked: true,
      } as MatCheckboxChange;

      const emitSpy = jest.spyOn(component.licenseToggle, 'emit');

      component.onLicenseToggle(event, license.id);

      expect(emitSpy).toHaveBeenCalledWith({
        licenseId: license.id,
        enabled: true,
      } as LicenseToggleEvent);
    });

    it('should emit licenseToggle event when checkbox is unchecked', () => {
      const license = component.licenses[1];
      const event = {
        checked: false,
      } as MatCheckboxChange;

      const emitSpy = jest.spyOn(component.licenseToggle, 'emit');

      component.onLicenseToggle(event, license.id);

      expect(emitSpy).toHaveBeenCalledWith({
        licenseId: license.id,
        enabled: false,
      } as LicenseToggleEvent);
    });

    it('should not mutate component state', () => {
      const originalLicenses = component.licenses;
      const license = component.licenses[0];
      const event = {
        checked: true,
      } as MatCheckboxChange;

      component.onLicenseToggle(event, license.id);

      expect(component.licenses).toBe(originalLicenses);
      expect(license.isEnabled).toBe(false);
    });
  });
});
