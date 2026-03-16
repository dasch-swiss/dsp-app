import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { UploadFileService } from '../representations/upload/upload-file.service';
import { UploadComponent } from './upload.component';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    notificationServiceMock = {
      openSnackBar: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: UploadFileService, useValue: { upload: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    component.projectShortcode = '0001';
    component.representation = Constants.HasStillImageFileValue;
    fixture.detectChanges();
  });

  describe('addFile', () => {
    it.each([
      ['test.svg', 'image/svg+xml'],
      ['test.jpg', 'image/jpeg'],
      ['test.png', 'image/png'],
      ['test.PNG', 'image/png'],
    ])('should accept %s', (filename, mimeType) => {
      const file = new File(['content'], filename, { type: mimeType });
      const uploadSpy = jest.spyOn(component as any, '_uploadProjectFile').mockImplementation(() => {});

      component.addFile(file);

      expect(uploadSpy).toHaveBeenCalledWith(file);
      expect(notificationServiceMock.openSnackBar).not.toHaveBeenCalled();
    });

    it.each([
      ['test.exe', 'application/octet-stream'],
      ['test.xyz', 'application/octet-stream'],
      ['test.mp4', 'video/mp4'],
    ])('should reject %s', (filename, mimeType) => {
      const file = new File(['content'], filename, { type: mimeType });

      component.addFile(file);

      expect(notificationServiceMock.openSnackBar).toHaveBeenCalled();
    });
  });
});
