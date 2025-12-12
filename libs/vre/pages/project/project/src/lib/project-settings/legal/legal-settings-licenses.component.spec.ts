import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { of, throwError } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';
import { LegalSettingsLicensesComponent } from './legal-settings-licenses.component';
import { LicenseToggleEvent } from './licenses-enabled-table.component';

describe('LegalSettingsLicensesComponent - Business Logic', () => {
  let component: LegalSettingsLicensesComponent;
  let fixture: ComponentFixture<LegalSettingsLicensesComponent>;
  let mockAdminApiService: jest.Mocked<AdminAPIApiService>;
  let mockPaginatedApiService: jest.Mocked<PaginatedApiService>;
  let mockProjectPageService: jest.Mocked<ProjectPageService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const mockProject = {
    shortcode: '0001',
    id: 'http://rdfh.ch/projects/0001',
  };

  beforeEach(async () => {
    mockAdminApiService = {
      putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriEnable: jest.fn().mockReturnValue(of({})),
      putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriDisable: jest.fn().mockReturnValue(of({})),
    } as any;

    mockPaginatedApiService = {
      getLicenses: jest.fn().mockReturnValue(of([])),
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
        { provide: AdminAPIApiService, useValue: mockAdminApiService },
        { provide: PaginatedApiService, useValue: mockPaginatedApiService },
        { provide: ProjectPageService, useValue: mockProjectPageService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalSettingsLicensesComponent);
    component = fixture.componentInstance;
  });

  describe('onLicenseToggle', () => {
    it('should call enable API when event.enabled is true', done => {
      const event: LicenseToggleEvent = {
        licenseId: 'http://creativecommons.org/licenses/by/4.0/',
        enabled: true,
      };

      component.onLicenseToggle(event);

      setTimeout(() => {
        expect(
          mockAdminApiService.putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriEnable
        ).toHaveBeenCalledWith('0001', event.licenseId);
        done();
      }, 100);
    });

    it('should call disable API when event.enabled is false', done => {
      const event: LicenseToggleEvent = {
        licenseId: 'http://creativecommons.org/licenses/by/4.0/',
        enabled: false,
      };

      component.onLicenseToggle(event);

      setTimeout(() => {
        expect(
          mockAdminApiService.putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriDisable
        ).toHaveBeenCalledWith('0001', event.licenseId);
        done();
      }, 100);
    });

    it('should show notification on API error when enabling', () => {
      mockAdminApiService.putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriEnable.mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      const event: LicenseToggleEvent = {
        licenseId: 'http://creativecommons.org/licenses/by/4.0/',
        enabled: true,
      };

      component.onLicenseToggle(event);

      expect(mockNotificationService.openSnackBar).toHaveBeenCalledWith('Failed to enable license. Please try again.');
    });

    it('should show notification on API error when disabling', () => {
      mockAdminApiService.putAdminProjectsShortcodeProjectshortcodeLegalInfoLicensesLicenseiriDisable.mockReturnValue(
        throwError(() => new Error('API Error'))
      );

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

      mockPaginatedApiService.getLicenses.mockReturnValue(of(mockLicenses as any));

      component.licenses$.subscribe(licenses => {
        expect(licenses).toEqual(mockLicenses);
        expect(mockPaginatedApiService.getLicenses).toHaveBeenCalledWith('0001');
        done();
      });
    });

    it('should filter recommended licenses correctly', done => {
      const mockLicenses = [
        { id: 'license1', isRecommended: true, isEnabled: false },
        { id: 'license2', isRecommended: false, isEnabled: true },
        { id: 'license3', isRecommended: true, isEnabled: true },
      ];

      mockPaginatedApiService.getLicenses.mockReturnValue(of(mockLicenses as any));

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

      mockPaginatedApiService.getLicenses.mockReturnValue(of(mockLicenses as any));

      component.nonRecommendedLicenses$.subscribe(licenses => {
        expect(licenses.length).toBe(1);
        expect(licenses.every(l => !l.isRecommended)).toBe(true);
        done();
      });
    });
  });
});
