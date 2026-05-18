import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLACEHOLDER_IRI } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { UploadFileService } from '../representations/upload/upload-file.service';
import { UploadedFileComponent } from './uploaded-file.component';

describe('UploadedFileComponent placeholder guard', () => {
  let fixture: ComponentFixture<UploadedFileComponent>;
  let uploadServiceMock: jest.Mocked<Partial<UploadFileService>>;

  beforeEach(async () => {
    uploadServiceMock = {
      getFileInfo: jest.fn().mockReturnValue(of({ originalFilename: 'real.jp2' })),
    };

    await TestBed.configureTestingModule({
      imports: [UploadedFileComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideTranslateService(), { provide: UploadFileService, useValue: uploadServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadedFileComponent);
  });

  it('skips the UploadFileService.getFileInfo call when internalFilename is the sentinel', () => {
    fixture.componentInstance.internalFilename = PLACEHOLDER_IRI;
    fixture.componentInstance.projectShortcode = '0001';
    fixture.detectChanges();
    expect(uploadServiceMock.getFileInfo).not.toHaveBeenCalled();
  });

  it('calls UploadFileService.getFileInfo for a real filename', () => {
    fixture.componentInstance.internalFilename = 'asset-id.jp2';
    fixture.componentInstance.projectShortcode = '0001';
    fixture.detectChanges();
    expect(uploadServiceMock.getFileInfo).toHaveBeenCalledWith('asset-id', '0001');
  });
});
