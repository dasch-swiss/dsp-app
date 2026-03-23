import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Constants, ReadResource, ReadStillImageVectorFileValue } from '@dasch-swiss/dsp-js';
import { NoResultsFoundComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';
import { CompoundArrowNavigationComponent } from '../../compound/compound-arrow-navigation.component';
import { CompoundSliderComponent } from '../../compound/compound-slider.component';
import { VectorImageToolbarComponent } from './vector-image-toolbar.component';
import { VectorViewerService } from './vector-viewer.service';

@Component({
  selector: 'app-vector-image',
  template: `
    @if (errorMessage) {
      <app-no-results-found
        [message]="errorMessage"
        [color]="'white'"
        style="flex: 1; justify-content: center; align-items: center; display: flex;" />
    } @else {
      <div
        class="vector-container"
        #vectorContainer
        [class.dragging]="isDragging"
        [class.fullscreen]="isFullscreen"
        [style.background]="backgroundStyle"
        (wheel)="onWheel($event)"
        (mousedown)="onMouseDown($event)"
        (dblclick)="onDoubleClick($event)">
        @if (compoundMode) {
          <div>
            <app-compound-arrow-navigation [forwardNavigation]="false" class="arrow" />
            <app-compound-arrow-navigation [forwardNavigation]="true" class="arrow" />
          </div>
        }
        <div class="svg-wrapper" [style.transform]="transform">
          @if (sanitizedSvg) {
            <div class="svg-content" [innerHTML]="sanitizedSvg"></div>
          }
        </div>
        <!-- Mini navigator -->
        @if (showNavigator && sanitizedSvg) {
          <div class="navigator" [style.width]="navigatorWidth" [style.height]="navigatorHeight">
            <div class="navigator-svg" [innerHTML]="sanitizedSvg" [style.transform]="navigatorSvgScale"></div>
            <div
              class="viewport-indicator"
              [style.left]="viewportLeft"
              [style.top]="viewportTop"
              [style.width]="viewportWidth"
              [style.height]="viewportHeight"></div>
          </div>
        }
      </div>
      <div class="toolbar-container">
        @if (compoundMode) {
          <app-compound-slider />
        }
        <app-vector-image-toolbar
          [resource]="resource"
          (zoomIn)="viewerService.zoom(1)"
          (zoomOut)="viewerService.zoom(-1)"
          (resetZoom)="viewerService.goHome()"
          (fullscreen)="toggleFullscreen()"
          (backgroundChange)="onBackgroundChange($event)" />
      </div>
    }
  `,
  styleUrls: ['./vector-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [VectorViewerService],
  imports: [
    NoResultsFoundComponent,
    VectorImageToolbarComponent,
    CompoundArrowNavigationComponent,
    CompoundSliderComponent,
  ],
})
export class VectorImageComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) resource!: ReadResource;
  @Input() compoundMode = false;
  @ViewChild('vectorContainer') containerRef!: ElementRef<HTMLElement>;

  sanitizedSvg: SafeHtml | null = null;
  errorMessage: string | null = null;
  isDragging = false;
  isFullscreen = false;
  showNavigator = true;
  backgroundStyle = '';
  transform = '';

  // Navigator styles
  navigatorWidth = '120px';
  navigatorHeight = '120px';
  navigatorSvgScale = 'scale(1)';
  viewportLeft = '0px';
  viewportTop = '0px';
  viewportWidth = '100%';
  viewportHeight = '100%';

  private readonly _NAVIGATOR_SCALE = 8;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _lastTranslateX = 0;
  private _lastTranslateY = 0;
  private _containerWidth = 0;
  private _containerHeight = 0;
  private readonly _destroyRef = inject(DestroyRef);

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _http: HttpClient,
    private readonly _sanitizer: DomSanitizer,
    private readonly _translateService: TranslateService,
    public readonly viewerService: VectorViewerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resource'] && !changes['resource'].firstChange) {
      this._loadSvg();
    }
  }

  ngAfterViewInit(): void {
    this.viewerService.state$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(state => {
      this.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
      this._updateNavigatorViewport(state.scale, state.translateX, state.translateY);
      this._cdr.markForCheck();
    });

    this._loadSvg();
  }

  /**
   * Ensures SVG has width and height attributes.
   * If missing, extracts dimensions from viewBox.
   */
  private _normalizeSvgDimensions(svgContent: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) {
      return svgContent;
    }

    const hasWidth = svg.hasAttribute('width');
    const hasHeight = svg.hasAttribute('height');

    if (hasWidth && hasHeight) {
      return svgContent;
    }

    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+|,/).map(Number);
      if (parts.length === 4) {
        const [, , width, height] = parts;
        if (!hasWidth) {
          svg.setAttribute('width', String(width));
        }
        if (!hasHeight) {
          svg.setAttribute('height', String(height));
        }
        return new XMLSerializer().serializeToString(doc);
      }
    }

    return svgContent;
  }

  private _cacheContainerDimensions(): void {
    if (this.containerRef?.nativeElement) {
      this._containerWidth = this.containerRef.nativeElement.clientWidth;
      this._containerHeight = this.containerRef.nativeElement.clientHeight;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this._cacheContainerDimensions();
  }

  ngOnDestroy(): void {
    if (this.isFullscreen) {
      document.exitFullscreen?.();
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    // Get the position relative to container center for zoom-to-cursor
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    // Zoom towards cursor position
    this.viewerService.zoom(direction as 1 | -1, mouseX - centerX, mouseY - centerY);
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Only handle left click
    this.isDragging = true;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._lastTranslateX = this.viewerService.translateX;
    this._lastTranslateY = this.viewerService.translateY;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const deltaX = event.clientX - this._dragStartX;
    const deltaY = event.clientY - this._dragStartY;
    this.viewerService.setPosition(this._lastTranslateX + deltaX, this._lastTranslateY + deltaY);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  onDoubleClick(event: MouseEvent): void {
    // Zoom in on double click (same behavior as OSD)
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    this.viewerService.zoom(1, mouseX - centerX, mouseY - centerY);
  }

  onBackgroundChange(bg: 'default' | 'white' | 'transparent'): void {
    switch (bg) {
      case 'white':
        this.backgroundStyle = 'white';
        break;
      case 'transparent':
        this.backgroundStyle =
          'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%) 0 0 / 24px 24px,' +
          'linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%) 12px 12px / 24px 24px';
        break;
      default:
        this.backgroundStyle = '';
    }
    this._cdr.markForCheck();
  }

  toggleFullscreen(): void {
    const container = this.containerRef?.nativeElement?.parentElement;
    if (!container) return;

    this.isFullscreen ? document.exitFullscreen?.() : container.requestFullscreen?.();

    this.isFullscreen = !this.isFullscreen;
    this._cdr.markForCheck();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
    this._cdr.markForCheck();
  }

  private _loadSvg(): void {
    this.errorMessage = null;

    const imageValues = this.resource.properties[Constants.HasStillImageFileValue];
    if (!imageValues?.length) {
      this.errorMessage = this._translateService.instant(
        'resourceEditor.representations.stillImage.errors.unknownImageType'
      );
      this._cdr.markForCheck();
      return;
    }

    const image = imageValues[0];
    if (image.type !== Constants.StillImageVectorFileValue) {
      this.errorMessage = this._translateService.instant(
        'resourceEditor.representations.stillImage.errors.unknownImageType'
      );
      this._cdr.markForCheck();
      return;
    }

    const vectorImage = image as ReadStillImageVectorFileValue;

    // Fetch SVG content as text
    this._http
      .get(vectorImage.fileUrl, { responseType: 'text' })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: svgContent => {
          const normalizedSvg = this._normalizeSvgDimensions(svgContent);
          this.sanitizedSvg = this._sanitizer.bypassSecurityTrustHtml(normalizedSvg);
          this.viewerService.goHome();
          // Cache dimensions and initialize navigator after DOM updates
          requestAnimationFrame(() => {
            this._cacheContainerDimensions();
            this._updateNavigatorViewport(1, 0, 0);
            this._cdr.markForCheck();
          });
        },
        error: () => {
          this.errorMessage = this._translateService.instant(
            'resourceEditor.representations.stillImage.errors.failedToLoadImage'
          );
          this._cdr.markForCheck();
        },
      });
  }

  private _updateNavigatorViewport(scale: number, translateX: number, translateY: number): void {
    if (this._containerWidth === 0 || this._containerHeight === 0) {
      this._cacheContainerDimensions();
      if (this._containerWidth === 0 || this._containerHeight === 0) {
        return;
      }
    }

    const containerWidth = this._containerWidth;
    const containerHeight = this._containerHeight;

    // Navigator is container divided by 8
    const navigatorWidthPx = containerWidth / this._NAVIGATOR_SCALE;
    const navigatorHeightPx = containerHeight / this._NAVIGATOR_SCALE;

    this.navigatorWidth = `${navigatorWidthPx}px`;
    this.navigatorHeight = `${navigatorHeightPx}px`;

    // Scale the SVG in the navigator by 1/8
    const scaleRatio = 1 / this._NAVIGATOR_SCALE;
    this.navigatorSvgScale = `scale(${scaleRatio})`;

    // At scale=1, viewport fills the navigator (we see everything)
    // At scale=2, viewport is half size (we see half)
    const viewportWidth = navigatorWidthPx / scale;
    const viewportHeight = navigatorHeightPx / scale;

    // To convert to "world" coordinates: divide by scale
    // Then convert to navigator pixels: divide by _NAVIGATOR_SCALE
    const viewportCenterX = navigatorWidthPx / 2 - translateX / scale / this._NAVIGATOR_SCALE;
    const viewportCenterY = navigatorHeightPx / 2 - translateY / scale / this._NAVIGATOR_SCALE;

    const viewportLeft = viewportCenterX - viewportWidth / 2;
    const viewportTop = viewportCenterY - viewportHeight / 2;

    this.viewportLeft = `${viewportLeft}px`;
    this.viewportTop = `${viewportTop}px`;
    this.viewportWidth = `${viewportWidth}px`;
    this.viewportHeight = `${viewportHeight}px`;
  }
}
