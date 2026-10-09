import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RepresentationService } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { TableImageCellComponent } from './table-image-cell.component';
import { TableImage } from './table-row.model';

const SIPI_IMAGE: TableImage = {
  url: 'https://iiif.example.org/0803/page.jp2/full/!256,256/0/default.jpg',
  previewUrl: 'https://iiif.example.org/0803/page.jp2/full/!640,640/0/default.jpg',
  isSipi: true,
};

const EXTERNAL_IMAGE: TableImage = {
  url: 'https://iiif.other.org/abc/full/!256,256/0/default.jpg',
  previewUrl: 'https://iiif.other.org/abc/full/!640,640/0/default.jpg',
  isSipi: false,
};

describe('TableImageCellComponent', () => {
  let fixture: ComponentFixture<TableImageCellComponent>;
  let getImageBlob: jest.Mock;
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let urlCount: number;

  beforeEach(async () => {
    urlCount = 0;
    getImageBlob = jest.fn().mockReturnValue(of(new Blob()));
    // jsdom has neither; each call hands out a distinct URL so the tests can tell renditions apart.
    createObjectURL = jest.fn(() => `blob:image-${++urlCount}`);
    revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    await TestBed.configureTestingModule({
      imports: [TableImageCellComponent, TranslateModule.forRoot()],
      providers: [{ provide: RepresentationService, useValue: { getImageBlob } }],
    }).compileComponents();
  });

  const render = (image: TableImage) => {
    fixture = TestBed.createComponent(TableImageCellComponent);
    fixture.componentRef.setInput('image', image);
    fixture.componentRef.setInput('label', 'a1r');
    fixture.detectChanges();
  };

  const thumbnailButton = () => fixture.nativeElement.querySelector('[data-cy="image-thumbnail"]') as HTMLButtonElement;
  const thumbnail = () => fixture.nativeElement.querySelector('.thumbnail') as HTMLImageElement | null;
  const preview = () => document.querySelector('[data-cy="image-preview"]');
  const fire = (target: EventTarget, type: string) => {
    target.dispatchEvent(new Event(type));
    fixture.detectChanges();
  };

  afterEach(() => fixture?.destroy());

  describe('thumbnail', () => {
    /** A bare `src` cannot carry the token, and Sipi refuses a non-public image without it. */
    it('FetchesADspImageWithTheUsersTokenAndShowsTheBlob', () => {
      render(SIPI_IMAGE);

      expect(getImageBlob).toHaveBeenCalledWith(SIPI_IMAGE.url);
      expect(thumbnail()?.getAttribute('src')).toBe('blob:image-1');
    });

    it('BindsAnExternalImageDirectly', () => {
      render(EXTERNAL_IMAGE);

      expect(getImageBlob).not.toHaveBeenCalled();
      expect(thumbnail()?.getAttribute('src')).toBe(EXTERNAL_IMAGE.url);
    });

    it('ShowsADashWhenTheImageCannotBeFetched', () => {
      getImageBlob.mockReturnValue(throwError(() => new Error('403')));

      render(SIPI_IMAGE);

      expect(thumbnail()).toBeNull();
      expect(fixture.nativeElement.querySelector('.unavailable')?.textContent).toContain('—');
    });

    it('NamesTheButtonAfterTheResource', () => {
      render(SIPI_IMAGE);

      expect(thumbnailButton().getAttribute('aria-label')).toContain('pages.dataBrowser.table.previewImage');
      expect(thumbnailButton().getAttribute('aria-expanded')).toBe('false');
    });

    it('ReleasesItsObjectUrlsWhenTheCellGoes', () => {
      render(SIPI_IMAGE);

      fixture.destroy();

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:image-1');
    });
  });

  describe('preview', () => {
    /** Sweeping the pointer down the column must not flash a preview per row. */
    it('OpensOnlyOnceTheHoverHasLasted', fakeAsync(() => {
      render(SIPI_IMAGE);

      fire(thumbnailButton(), 'mouseenter');
      tick(300);
      fixture.detectChanges();
      expect(preview()).toBeNull();

      tick(50);
      fixture.detectChanges();
      expect(preview()).not.toBeNull();
      expect(thumbnailButton().getAttribute('aria-expanded')).toBe('true');
      discardPeriodicTasks();
    }));

    it('DoesNotOpenWhenThePointerPassesStraightThrough', fakeAsync(() => {
      render(SIPI_IMAGE);

      fire(thumbnailButton(), 'mouseenter');
      tick(100);
      fire(thumbnailButton(), 'mouseleave');
      tick(1000);
      fixture.detectChanges();

      expect(preview()).toBeNull();
    }));

    /** A touch screen has no hover. */
    it('OpensAtOnceOnAClick', () => {
      render(SIPI_IMAGE);

      fire(thumbnailButton(), 'click');

      expect(preview()).not.toBeNull();
    });

    it('ShowsTheLargerRenditionFetchedOnlyOnFirstOpen', () => {
      render(SIPI_IMAGE);

      fire(thumbnailButton(), 'click');
      thumbnailButton().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      fire(thumbnailButton(), 'click');

      expect(getImageBlob.mock.calls.filter(([url]) => url === SIPI_IMAGE.previewUrl)).toHaveLength(1);
      expect(preview()?.querySelector('img')?.getAttribute('src')).toBe('blob:image-2');
    });

    /** Until the larger rendition arrives, a smaller image beats an empty frame. */
    it('ShowsTheThumbnailWhileTheLargerRenditionLoads', () => {
      const larger = new Subject<Blob>();
      getImageBlob.mockImplementation((url: string) => (url === SIPI_IMAGE.previewUrl ? larger : of(new Blob())));
      render(SIPI_IMAGE);

      fire(thumbnailButton(), 'click');

      expect(preview()?.querySelector('img')?.getAttribute('src')).toBe('blob:image-1');
    });

    it('ClosesOnEscape', () => {
      render(SIPI_IMAGE);
      fire(thumbnailButton(), 'click');

      thumbnailButton().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(preview()).toBeNull();
    });

    it('ClosesShortlyAfterThePointerLeaves', fakeAsync(() => {
      render(SIPI_IMAGE);
      fire(thumbnailButton(), 'click');

      fire(thumbnailButton(), 'mouseleave');
      tick(150);
      fixture.detectChanges();

      expect(preview()).toBeNull();
    }));

    /** The gap between thumbnail and preview must be crossable without the preview closing. */
    it('StaysOpenWhileThePointerMovesIntoThePreview', fakeAsync(() => {
      render(SIPI_IMAGE);
      fire(thumbnailButton(), 'click');

      fire(thumbnailButton(), 'mouseleave');
      tick(100);
      fire(preview()!, 'mouseenter');
      tick(1000);
      fixture.detectChanges();

      expect(preview()).not.toBeNull();
    }));
  });
});
