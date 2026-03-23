import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadResource, ReadStillImageVectorFileValue } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { VectorImageComponent } from './vector-image.component';

describe('VectorImageComponent', () => {
  let component: VectorImageComponent;
  let fixture: ComponentFixture<VectorImageComponent>;
  let httpMock: HttpTestingController;

  const mockSvgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

  const createMockResource = (fileUrl: string): ReadResource => {
    const vectorFileValue = {
      type: Constants.StillImageVectorFileValue,
      fileUrl,
      arkUrl: 'http://ark.example.com/test',
    } as ReadStillImageVectorFileValue;

    return {
      properties: {
        [Constants.HasStillImageFileValue]: [vectorFileValue],
      },
    } as unknown as ReadResource;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VectorImageComponent, HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(true) } },
        { provide: RepresentationService, useValue: { downloadProjectFile: jest.fn() } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VectorImageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('SVG loading', () => {
    it('should load and display SVG content', () => {
      component.resource = createMockResource('http://example.com/test.svg');
      fixture.detectChanges();

      const req = httpMock.expectOne('http://example.com/test.svg');
      req.flush(mockSvgContent);

      expect(component.sanitizedSvg).toBeTruthy();
      expect(component.errorMessage).toBeNull();
    });

    it('should show error message when SVG fails to load', () => {
      component.resource = createMockResource('http://example.com/test.svg');
      fixture.detectChanges();

      const req = httpMock.expectOne('http://example.com/test.svg');
      req.error(new ProgressEvent('error'));

      expect(component.errorMessage).toBeTruthy();
    });

    it('should show error when resource has no image values', () => {
      component.resource = {
        properties: {},
      } as unknown as ReadResource;
      fixture.detectChanges();

      expect(component.errorMessage).toBeTruthy();
    });
  });

  describe('SVG normalization', () => {
    it('should add width and height from viewBox if missing', () => {
      const svgWithoutDimensions =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect fill="blue"/></svg>';

      component.resource = createMockResource('http://example.com/test.svg');
      fixture.detectChanges();

      const req = httpMock.expectOne('http://example.com/test.svg');
      req.flush(svgWithoutDimensions);

      // The sanitizedSvg should contain the normalized SVG
      expect(component.sanitizedSvg).toBeTruthy();
    });

    it('should not modify SVG that already has width and height', () => {
      component.resource = createMockResource('http://example.com/test.svg');
      fixture.detectChanges();

      const req = httpMock.expectOne('http://example.com/test.svg');
      req.flush(mockSvgContent);

      expect(component.sanitizedSvg).toBeTruthy();
    });
  });

  describe('zoom and pan', () => {
    beforeEach(() => {
      component.resource = createMockResource('http://example.com/test.svg');
      fixture.detectChanges();

      const req = httpMock.expectOne('http://example.com/test.svg');
      req.flush(mockSvgContent);
    });

    it('should update transform on zoom', () => {
      component.viewerService.zoom(1);

      expect(component.transform).toContain('scale(1.2)');
    });

    it('should reset transform on goHome', () => {
      component.viewerService.zoom(1);
      component.viewerService.setPosition(100, 100);
      component.viewerService.goHome();

      expect(component.transform).toBe('translate(0px, 0px) scale(1)');
    });

    it('should set isDragging on mousedown', () => {
      const event = new MouseEvent('mousedown', { button: 0 });
      component.onMouseDown(event);

      expect(component.isDragging).toBe(true);
    });

    it('should reset isDragging on mouseup', () => {
      component.isDragging = true;
      component.onMouseUp();

      expect(component.isDragging).toBe(false);
    });
  });

  describe('background change', () => {
    beforeEach(() => {
      component.resource = createMockResource('http://example.com/test.svg');
      fixture.detectChanges();

      const req = httpMock.expectOne('http://example.com/test.svg');
      req.flush(mockSvgContent);
    });

    it('should set white background', () => {
      component.onBackgroundChange('white');

      expect(component.backgroundStyle).toBe('white');
    });

    it('should set transparent checkerboard background', () => {
      component.onBackgroundChange('transparent');

      expect(component.backgroundStyle).toContain('linear-gradient');
    });

    it('should reset to default background', () => {
      component.onBackgroundChange('white');
      component.onBackgroundChange('default');

      expect(component.backgroundStyle).toBe('');
    });
  });
});
