import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadResource, ReadStillImageVectorFileValue } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { VectorImageComponent } from './vector-image.component';

describe('VectorImageComponent', () => {
  let component: VectorImageComponent;
  let fixture: ComponentFixture<VectorImageComponent>;
  let httpMock: HttpTestingController;
  let translateServiceMock: jest.Mocked<Partial<TranslateService>>;

  const mockSvgContent =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

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
    translateServiceMock = {
      instant: jest.fn().mockReturnValue('Error message'),
    };

    await TestBed.configureTestingModule({
      imports: [VectorImageComponent, HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(true) } },
        { provide: RepresentationService, useValue: { downloadProjectFile: jest.fn() } },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: TranslateService, useValue: translateServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VectorImageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should reload SVG when resource changes', () => {
      const loadSvgSpy = jest.spyOn(component as any, '_loadSvg');
      component.resource = createMockResource('http://example.com/test.svg');

      component.ngOnChanges({
        resource: new SimpleChange(null, component.resource, false),
      });

      expect(loadSvgSpy).toHaveBeenCalled();
      // Clean up pending HTTP request
      httpMock.expectOne('http://example.com/test.svg').flush(mockSvgContent);
    });

    it('should not reload SVG on first change', () => {
      const loadSvgSpy = jest.spyOn(component as any, '_loadSvg');
      component.resource = createMockResource('http://example.com/test.svg');

      component.ngOnChanges({
        resource: new SimpleChange(null, component.resource, true),
      });

      expect(loadSvgSpy).not.toHaveBeenCalled();
    });
  });

  describe('_loadSvg', () => {
    it('should load and sanitize SVG content', done => {
      component.resource = createMockResource('http://example.com/test.svg');
      component['_loadSvg']();

      const req = httpMock.expectOne('http://example.com/test.svg');
      req.flush(mockSvgContent);

      setTimeout(() => {
        expect(component.sanitizedSvg).toBeTruthy();
        expect(component.errorMessage).toBeNull();
        done();
      }, 10);
    });

    it('should set error message when SVG fails to load', done => {
      component.resource = createMockResource('http://example.com/test.svg');
      component['_loadSvg']();

      const req = httpMock.expectOne('http://example.com/test.svg');
      req.error(new ProgressEvent('error'));

      setTimeout(() => {
        expect(component.errorMessage).toBeTruthy();
        done();
      }, 10);
    });

    it('should set error when resource has no image values', () => {
      component.resource = {
        properties: {},
      } as unknown as ReadResource;

      component['_loadSvg']();

      expect(component.errorMessage).toBeTruthy();
    });

    it('should set error when image type is not vector', () => {
      component.resource = {
        properties: {
          [Constants.HasStillImageFileValue]: [{ type: 'other-type' }],
        },
      } as unknown as ReadResource;

      component['_loadSvg']();

      expect(component.errorMessage).toBeTruthy();
    });
  });

  describe('_normalizeSvgDimensions', () => {
    it('should add width and height from viewBox if missing', () => {
      const svgWithoutDimensions =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect fill="blue"/></svg>';

      const result = component['_normalizeSvgDimensions'](svgWithoutDimensions);

      expect(result).toContain('width="200"');
      expect(result).toContain('height="150"');
    });

    it('should not modify SVG that already has width and height', () => {
      const result = component['_normalizeSvgDimensions'](mockSvgContent);

      // Should return the same content (unchanged)
      expect(result).toContain('width="100"');
      expect(result).toContain('height="100"');
    });

    it('should handle SVG without viewBox', () => {
      const svgWithoutViewBox = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="blue"/></svg>';

      const result = component['_normalizeSvgDimensions'](svgWithoutViewBox);

      // Should return unchanged since there's no viewBox to extract from
      expect(result).not.toContain('width=');
    });
  });

  describe('zoom and pan', () => {
    beforeEach(() => {
      // Initialize the subscription to viewerService.state$
      component.resource = createMockResource('http://example.com/test.svg');
      component.ngAfterViewInit();
      httpMock.expectOne('http://example.com/test.svg').flush(mockSvgContent);
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

    it('should set isDragging on mousedown with left button', () => {
      const event = new MouseEvent('mousedown', { button: 0 });
      component.onMouseDown(event);

      expect(component.isDragging).toBe(true);
    });

    it('should not set isDragging on mousedown with right button', () => {
      const event = new MouseEvent('mousedown', { button: 2 });
      component.onMouseDown(event);

      expect(component.isDragging).toBe(false);
    });

    it('should reset isDragging on mouseup', () => {
      component.isDragging = true;
      component.onMouseUp();

      expect(component.isDragging).toBe(false);
    });
  });

  describe('onBackgroundChange', () => {
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

  describe('onWheel', () => {
    beforeEach(() => {
      // Mock containerRef
      component.containerRef = {
        nativeElement: {
          getBoundingClientRect: () => ({
            width: 800,
            height: 600,
            left: 0,
            top: 0,
          }),
        },
      } as any;
    });

    it('should zoom out on wheel down', () => {
      const zoomSpy = jest.spyOn(component.viewerService, 'zoom');
      const event = new WheelEvent('wheel', { deltaY: 100 });

      component.onWheel(event);

      expect(zoomSpy).toHaveBeenCalledWith(-1, expect.any(Number), expect.any(Number));
    });

    it('should zoom in on wheel up', () => {
      const zoomSpy = jest.spyOn(component.viewerService, 'zoom');
      const event = new WheelEvent('wheel', { deltaY: -100 });

      component.onWheel(event);

      expect(zoomSpy).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Number));
    });
  });

  describe('onDoubleClick', () => {
    beforeEach(() => {
      component.containerRef = {
        nativeElement: {
          getBoundingClientRect: () => ({
            width: 800,
            height: 600,
            left: 0,
            top: 0,
          }),
        },
      } as any;
    });

    it('should zoom in on double click', () => {
      const zoomSpy = jest.spyOn(component.viewerService, 'zoom');
      const event = new MouseEvent('dblclick', { clientX: 400, clientY: 300 });

      component.onDoubleClick(event);

      expect(zoomSpy).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Number));
    });
  });

  describe('toggleFullscreen', () => {
    it('should toggle isFullscreen state', () => {
      component.containerRef = {
        nativeElement: {
          parentElement: {
            requestFullscreen: jest.fn(),
          },
        },
      } as any;

      component.isFullscreen = false;
      component.toggleFullscreen();

      expect(component.isFullscreen).toBe(true);
    });

    it('should handle missing container gracefully', () => {
      component.containerRef = undefined as any;

      expect(() => component.toggleFullscreen()).not.toThrow();
    });
  });
});
