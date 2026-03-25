import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadResource, ReadStillImageVectorFileValue } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { VectorImageToolbarComponent } from './vector-image-toolbar.component';

describe('VectorImageToolbarComponent', () => {
  let component: VectorImageToolbarComponent;
  let fixture: ComponentFixture<VectorImageToolbarComponent>;
  let representationServiceMock: jest.Mocked<RepresentationService>;

  const createMockResource = (): ReadResource => {
    const vectorFileValue = {
      type: Constants.StillImageVectorFileValue,
      fileUrl: 'http://example.com/test.svg',
      arkUrl: 'http://ark.example.com/test',
    } as ReadStillImageVectorFileValue;

    return {
      properties: {
        [Constants.HasStillImageFileValue]: [vectorFileValue],
      },
    } as unknown as ReadResource;
  };

  beforeEach(async () => {
    representationServiceMock = {
      downloadProjectFile: jest.fn(),
    } as unknown as jest.Mocked<RepresentationService>;

    await TestBed.configureTestingModule({
      imports: [VectorImageToolbarComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(true) } },
        { provide: RepresentationService, useValue: representationServiceMock },
        { provide: MatDialog, useValue: { open: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VectorImageToolbarComponent);
    component = fixture.componentInstance;
    component.resource = createMockResource();
    // Don't call fixture.detectChanges() to avoid CSS parsing issues in JSDOM
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('imageFileValue', () => {
    it('should return the vector file value from resource', () => {
      expect(component.imageFileValue).toBeTruthy();
      expect(component.imageFileValue?.type).toBe(Constants.StillImageVectorFileValue);
    });

    it('should return null if no image values exist', () => {
      component.resource = { properties: {} } as unknown as ReadResource;

      expect(component.imageFileValue).toBeNull();
    });

    it('should return null if image type is not vector', () => {
      component.resource = {
        properties: {
          [Constants.HasStillImageFileValue]: [{ type: 'other-type' }],
        },
      } as unknown as ReadResource;

      expect(component.imageFileValue).toBeNull();
    });
  });

  describe('download', () => {
    it('should call representationService.downloadProjectFile', () => {
      component.download();

      expect(representationServiceMock.downloadProjectFile).toHaveBeenCalledWith(
        component.imageFileValue,
        component.resource
      );
    });

    it('should not call downloadProjectFile if imageFileValue is null', () => {
      component.resource = { properties: {} } as unknown as ReadResource;

      component.download();

      expect(representationServiceMock.downloadProjectFile).not.toHaveBeenCalled();
    });
  });

  describe('setBackground', () => {
    it('should emit backgroundChange event', () => {
      const emitSpy = jest.spyOn(component.backgroundChange, 'emit');

      component.setBackground('white');

      expect(emitSpy).toHaveBeenCalledWith('white');
    });
  });

  describe('output events', () => {
    it('should have zoomIn output', () => {
      const emitSpy = jest.spyOn(component.zoomIn, 'emit');

      component.zoomIn.emit();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should have zoomOut output', () => {
      const emitSpy = jest.spyOn(component.zoomOut, 'emit');

      component.zoomOut.emit();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should have resetZoom output', () => {
      const emitSpy = jest.spyOn(component.resetZoom, 'emit');

      component.resetZoom.emit();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should have fullscreen output', () => {
      const emitSpy = jest.spyOn(component.fullscreen, 'emit');

      component.fullscreen.emit();

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
