import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LegalInfoApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { ProjectDataRightsService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { of, throwError } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { LegalSettingsLicensesComponent } from './legal-settings-licenses.component';
import { LicenseToggleEvent } from './licenses-enabled-table.component';

describe('LegalSettingsLicensesComponent - Business Logic', () => {
  let component: LegalSettingsLicensesComponent;
  let fixture: ComponentFixture<LegalSettingsLicensesComponent>;
  let mockLegalInfoApiService: jest.Mocked<LegalInfoApiService>;
  let mockDataRightsService: jest.Mocked<ProjectDataRightsService>;
  let mockProjectPageService: jest.Mocked<ProjectPageService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const mockProject = {
    shortcode: '0001',
    id: 'http://rdfh.ch/projects/0001',
  };

  beforeEach(async () => {
    mockLegalInfoApiService = {
      getLicenses: jest.fn().mockReturnValue(of([])),
    } as any;

    mockDataRightsService = {
      enableLicense: jest.fn().mockReturnValue(of({})),
      disableLicense: jest.fn().mockReturnValue(of({})),
    } as any;

    mockProjectPageService = {
      currentProject$: of(mockProject),
      currentProject: mockProject,
    } as any;

    mockNotificationService = {
      openSnackBar: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [LegalSettingsLicensesComponent],
      providers: [
        { provide: LegalInfoApiService, useValue: mockLegalInfoApiService },
        { provide: ProjectDataRightsService, useValue: mockDataRightsService },
        { provide: ProjectPageService, useValue: mockProjectPageService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalSettingsLicensesComponent);
    component = fixture.componentInstance;
  });

  describe('onLicenseToggle', () => {
    it('should call enableLicense when event.enabled is true', done => {
      const event: LicenseToggleEvent = {
        licenseId: 'http://creativecommons.org/licenses/by/4.0/',
        enabled: true,
      };

      component.onLicenseToggle(event);

      setTimeout(() => {
        expect(mockDataRightsService.enableLicense).toHaveBeenCalledWith('0001', event.licenseId);
        done();
      }, 100);
    });

    it('should call disableLicense when event.enabled is false', done => {
      const event: LicenseToggleEvent = {
        licenseId: 'http://creativecommons.org/licenses/by/4.0/',
        enabled: false,
      };

      component.onLicenseToggle(event);

      setTimeout(() => {
        expect(mockDataRightsService.disableLicense).toHaveBeenCalledWith('0001', event.licenseId);
        done();
      }, 100);
    });

    it('should show notification on API error when enabling', () => {
      mockDataRightsService.enableLicense.mockReturnValue(throwError(() => new Error('API Error')));

      const event: LicenseToggleEvent = {
        licenseId: 'http://creativecommons.org/licenses/by/4.0/',
        enabled: true,
      };

      component.onLicenseToggle(event);

      expect(mockNotificationService.openSnackBar).toHaveBeenCalledWith('Failed to enable license. Please try again.');
    });

    it('should show notification on API error when disabling', () => {
      mockDataRightsService.disableLicense.mockReturnValue(throwError(() => new Error('API Error')));

      const event: LicenseToggleEvent = {
        licenseId: 'http://creativecommons.org/licenses/by-sa/4.0/',
        enabled: false,
      };

      component.onLicenseToggle(event);

      expect(mockNotificationService.openSnackBar).toHaveBeenCalledWith('Failed to disable license. Please try again.');
    });
  });

  describe('reactive data flow', () => {
    it('should load licenses when component initializes', done => {
      const mockLicenses = [
        { id: 'license1', isRecommended: true, isEnabled: false },
        { id: 'license2', isRecommended: false, isEnabled: true },
      ];

      mockLegalInfoApiService.getLicenses.mockReturnValue(of(mockLicenses as any));

      component.licenses$.subscribe(licenses => {
        expect(licenses).toEqual(mockLicenses);
        expect(mockLegalInfoApiService.getLicenses).toHaveBeenCalledWith('0001');
        done();
      });
    });

    it('should filter recommended licenses correctly', done => {
      const mockLicenses = [
        { id: 'license1', isRecommended: true, isEnabled: false },
        { id: 'license2', isRecommended: false, isEnabled: true },
        { id: 'license3', isRecommended: true, isEnabled: true },
      ];

      mockLegalInfoApiService.getLicenses.mockReturnValue(of(mockLicenses as any));

      component.recommendedLicenses$.subscribe(licenses => {
        expect(licenses.length).toBe(2);
        expect(licenses.every(l => l.isRecommended)).toBe(true);
        done();
      });
    });

    it('should filter non-recommended licenses correctly', done => {
      const mockLicenses = [
        { id: 'license1', isRecommended: true, isEnabled: false },
        { id: 'license2', isRecommended: false, isEnabled: true },
        { id: 'license3', isRecommended: true, isEnabled: true },
      ];

      mockLegalInfoApiService.getLicenses.mockReturnValue(of(mockLicenses as any));

      component.nonRecommendedLicenses$.subscribe(licenses => {
        expect(licenses.length).toBe(1);
        expect(licenses.every(l => !l.isRecommended)).toBe(true);
        done();
      });
    });
  });
});
