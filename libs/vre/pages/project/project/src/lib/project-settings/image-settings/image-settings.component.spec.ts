import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import {
  AdminAPIApiService,
  ProjectRestrictedViewSettingsGetResponseADM,
} from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ImageSettingsComponent, ImageSettingsEnum } from './image-settings.component';

describe('ImageSettingsComponent', () => {
  const projectIri = 'http://rdfh.ch/projects/0001';

  let component: ImageSettingsComponent;
  let fixture: ComponentFixture<ImageSettingsComponent>;
  let adminApi: {
    getAdminProjectsIriProjectiriRestrictedviewsettings: jest.Mock;
    postAdminProjectsIriProjectiriRestrictedviewsettings: jest.Mock;
    deleteAdminProjectsIriProjectiriRestrictedviewsettings: jest.Mock;
  };
  let openSnackBar: jest.Mock;

  const response = (
    settings: { size?: string; watermark: boolean },
    isDefault: boolean
  ): ProjectRestrictedViewSettingsGetResponseADM => ({ settings, isDefault });

  const nothingStored = response({ size: '!128,128', watermark: false }, true);
  const watermarkStored = response({ watermark: true }, false);
  const sizeStored = response({ size: 'pct:13', watermark: false }, false);

  beforeEach(async () => {
    adminApi = {
      getAdminProjectsIriProjectiriRestrictedviewsettings: jest.fn(),
      postAdminProjectsIriProjectiriRestrictedviewsettings: jest.fn(),
      deleteAdminProjectsIriProjectiriRestrictedviewsettings: jest.fn(),
    };
    openSnackBar = jest.fn();

    await TestBed.configureTestingModule({
      imports: [ImageSettingsComponent, NoopAnimationsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        TranslateService,
        { provide: AdminAPIApiService, useValue: adminApi },
        { provide: NotificationService, useValue: { openSnackBar } },
        { provide: ProjectService, useValue: { uuidToIri: () => projectIri } },
        {
          provide: ActivatedRoute,
          useValue: { parent: { parent: { snapshot: { paramMap: new Map([['uuid', 'a-uuid']]) } } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageSettingsComponent);
    component = fixture.componentInstance;
  });

  /** ngOnInit fires the GET, so the stubbed response has to be in place before the first detectChanges. */
  const loadWith = (loaded: ProjectRestrictedViewSettingsGetResponseADM) => {
    adminApi.getAdminProjectsIriProjectiriRestrictedviewsettings.mockReturnValue(of(loaded));
    fixture.detectChanges();
  };

  describe('loading', () => {
    it('selects Default when the project stores nothing', () => {
      loadWith(nothingStored);

      expect(component.imageSettings).toBe(ImageSettingsEnum.Default);
      expect(component.inheritedSize).toBe('!128,128');
    });

    it('selects Watermark when a watermark is stored', () => {
      loadWith(watermarkStored);

      expect(component.imageSettings).toBe(ImageSettingsEnum.Watermark);
      expect(component.inheritedSize).toBeUndefined();
    });

    it('selects Restrict image size when a size is stored', () => {
      loadWith(sizeStored);

      expect(component.imageSettings).toBe(ImageSettingsEnum.RestrictImageSize);
      expect(component.percentage).toBe('13');
    });

    it('disables Submit on a fresh load', () => {
      loadWith(sizeStored);

      expect(component.hasChanges).toBe(false);
    });

    it('selects Default when a stored setting is neither a watermark nor a size', () => {
      loadWith(response({ watermark: false }, false));

      expect(component.imageSettings).toBe(ImageSettingsEnum.Default);
      expect(component.hasChanges).toBe(false);
    });

    it('reads a cleared percentage field as a zero ratio, so the Submit guard still bites', () => {
      loadWith(sizeStored);
      component.percentage = '';

      expect(component.ratio).toBe(0);
    });

    it('enables Submit once the selection changes', () => {
      loadWith(nothingStored);
      component.imageSettings = ImageSettingsEnum.Watermark;

      expect(component.hasChanges).toBe(true);
    });
  });

  describe('saving', () => {
    it('issues a DELETE when Default is selected', () => {
      loadWith(sizeStored);
      adminApi.deleteAdminProjectsIriProjectiriRestrictedviewsettings.mockReturnValue(of(nothingStored));

      component.imageSettings = ImageSettingsEnum.Default;
      component.onSubmit();

      expect(adminApi.deleteAdminProjectsIriProjectiriRestrictedviewsettings).toHaveBeenCalledWith(projectIri);
      expect(adminApi.postAdminProjectsIriProjectiriRestrictedviewsettings).not.toHaveBeenCalled();
    });

    it('issues a POST when a size is selected', () => {
      loadWith(nothingStored);
      adminApi.postAdminProjectsIriProjectiriRestrictedviewsettings.mockReturnValue(of(sizeStored));

      component.imageSettings = ImageSettingsEnum.RestrictImageSize;
      component.percentage = '13';
      component.onSubmit();

      // The bare `{size: 'pct:13'}` is deliberate, not stale. The generated SetRestrictedViewRequest
      // says `{size: {value}}`, but dsp-api rejects that shape (DEV-7292). If this assertion starts
      // failing because the request was retyped, the retype is the bug — not this line.
      expect(adminApi.postAdminProjectsIriProjectiriRestrictedviewsettings).toHaveBeenCalledWith(projectIri, {
        size: 'pct:13',
      });
      expect(adminApi.deleteAdminProjectsIriProjectiriRestrictedviewsettings).not.toHaveBeenCalled();
    });

    it('never sends pct:100 by any path', () => {
      loadWith(nothingStored);
      adminApi.postAdminProjectsIriProjectiriRestrictedviewsettings.mockReturnValue(of(sizeStored));
      adminApi.deleteAdminProjectsIriProjectiriRestrictedviewsettings.mockReturnValue(of(nothingStored));

      for (const mode of [
        ImageSettingsEnum.Default,
        ImageSettingsEnum.Watermark,
        ImageSettingsEnum.RestrictImageSize,
      ]) {
        component.imageSettings = mode;
        component.onSubmit();
      }

      const bodies = adminApi.postAdminProjectsIriProjectiriRestrictedviewsettings.mock.calls.map(args =>
        JSON.stringify(args[1])
      );
      expect(bodies.some(body => body.includes('pct:100'))).toBe(false);
    });

    it('re-disables Submit after a successful save', () => {
      loadWith(sizeStored);
      adminApi.deleteAdminProjectsIriProjectiriRestrictedviewsettings.mockReturnValue(of(nothingStored));

      component.imageSettings = ImageSettingsEnum.Default;
      component.onSubmit();

      expect(component.hasChanges).toBe(false);
    });

    it('leaves the failure to AppErrorHandler rather than confirming a save that did not happen', () => {
      loadWith(sizeStored);
      adminApi.deleteAdminProjectsIriProjectiriRestrictedviewsettings.mockReturnValue(
        throwError(() => new Error('boom'))
      );

      component.imageSettings = ImageSettingsEnum.Default;
      component.onSubmit();

      expect(openSnackBar).not.toHaveBeenCalled();
      expect(component.hasChanges).toBe(true);
    });
  });

  describe('the inherited limit', () => {
    it('reads an absolute limit as dimensions', () => {
      loadWith(nothingStored);

      expect(component.inheritedDimensions).toEqual({ width: '128', height: '128' });
      expect(component.inheritedPercentage).toBeNull();
    });

    it('reads a percentage limit as a percentage', () => {
      loadWith(response({ size: 'pct:25', watermark: false }, true));

      expect(component.inheritedPercentage).toBe('25');
      expect(component.inheritedDimensions).toBeNull();
    });

    it('shows nothing when the project stores its own setting', () => {
      loadWith(sizeStored);

      expect(component.inheritedDimensions).toBeNull();
      expect(component.inheritedPercentage).toBeNull();
    });
  });
});
