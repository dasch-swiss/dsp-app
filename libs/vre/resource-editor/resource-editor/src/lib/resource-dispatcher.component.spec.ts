import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, CountQueryResponse, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { of, Subject } from 'rxjs';
import { ResourceDispatcherComponent } from './resource-dispatcher.component';
import { ResourceType } from './resource-type';

// Minimal resource factory
const makeResource = (overrides: Partial<ReadResource> = {}): DspResource =>
  ({
    res: {
      id: 'http://rdfh.ch/resource1',
      type: 'http://example.org/onto#SomeClass',
      properties: {},
      ...overrides,
    } as unknown as ReadResource,
  }) as unknown as DspResource;

const makeImageResource = (): DspResource =>
  makeResource({
    properties: {
      [Constants.HasStillImageFileValue]: [{ filename: 'image.jp2', type: Constants.StillImageFileValue }],
    },
  });

const makeVideoResource = (): DspResource =>
  makeResource({
    properties: { [Constants.HasMovingImageFileValue]: [{ filename: 'video.mp4' }] },
  });

const makeAudioResource = (): DspResource =>
  makeResource({
    properties: { [Constants.HasAudioFileValue]: [{ filename: 'audio.mp3' }] },
  });

const makePdfResource = (): DspResource =>
  makeResource({
    properties: { [Constants.HasDocumentFileValue]: [{ filename: 'doc.pdf' }] },
  });

const makeDocumentResource = (): DspResource =>
  makeResource({
    properties: { [Constants.HasDocumentFileValue]: [{ filename: 'doc.docx' }] },
  });

const makeArchiveResource = (): DspResource =>
  makeResource({
    properties: { [Constants.HasArchiveFileValue]: [{ filename: 'data.zip' }] },
  });

const makeTextResource = (): DspResource =>
  makeResource({
    properties: { [Constants.HasTextFileValue]: [{ filename: 'note.txt' }] },
  });

const makeAnnotationResource = (): DspResource =>
  makeResource({ type: Constants.Region, properties: {} });

const makeSegmentResource = (): DspResource =>
  makeResource({
    type: 'http://api.knora.org/ontology/knora-api/v2#VideoSegment',
    properties: {},
  });

const makePlainResource = (): DspResource =>
  makeResource({ type: 'http://example.org/onto#SomeClass', properties: {} });

describe('ResourceDispatcherComponent', () => {
  let component: ResourceDispatcherComponent;
  let fixture: ComponentFixture<ResourceDispatcherComponent>;
  let cdrMock: jest.Mocked<Pick<ChangeDetectorRef, 'detectChanges'>>;
  let countQuerySubject: Subject<CountQueryResponse>;
  let dspApiMock: { v2: { search: { doSearchStillImageRepresentationsCount: jest.Mock } } };

  beforeEach(async () => {
    countQuerySubject = new Subject<CountQueryResponse>();
    cdrMock = { detectChanges: jest.fn() };
    dspApiMock = {
      v2: {
        search: {
          doSearchStillImageRepresentationsCount: jest.fn().mockReturnValue(countQuerySubject.asObservable()),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ResourceDispatcherComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(ResourceDispatcherComponent, {
        set: {
          template: '<div></div>',
          providers: [
            { provide: ChangeDetectorRef, useValue: cdrMock },
            { provide: DspApiConnectionToken, useValue: dspApiMock },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResourceDispatcherComponent);
    component = fixture.componentInstance;
  });

  const triggerNgOnChanges = (resource: DspResource) => {
    component.resource = resource;
    component.ngOnChanges();
  };

  describe('when the resource has a still image file value', () => {
    it('sets resourceType to Image immediately', () => {
      triggerNgOnChanges(makeImageResource());
      expect(component.resourceType).toBe(ResourceType.Image);
    });
  });

  describe('when the resource has a moving image file value', () => {
    it('sets resourceType to Video immediately', () => {
      triggerNgOnChanges(makeVideoResource());
      expect(component.resourceType).toBe(ResourceType.Video);
    });
  });

  describe('when the resource has an audio file value', () => {
    it('sets resourceType to Audio immediately', () => {
      triggerNgOnChanges(makeAudioResource());
      expect(component.resourceType).toBe(ResourceType.Audio);
    });
  });

  describe('when the resource has a PDF document file value', () => {
    it('sets resourceType to Pdf immediately', () => {
      triggerNgOnChanges(makePdfResource());
      expect(component.resourceType).toBe(ResourceType.Pdf);
    });
  });

  describe('when the resource has a non-PDF document file value', () => {
    it('sets resourceType to Document immediately', () => {
      triggerNgOnChanges(makeDocumentResource());
      expect(component.resourceType).toBe(ResourceType.Document);
    });
  });

  describe('when the resource has an archive file value', () => {
    it('sets resourceType to Archive immediately', () => {
      triggerNgOnChanges(makeArchiveResource());
      expect(component.resourceType).toBe(ResourceType.Archive);
    });
  });

  describe('when the resource has a text file value', () => {
    it('sets resourceType to Text immediately', () => {
      triggerNgOnChanges(makeTextResource());
      expect(component.resourceType).toBe(ResourceType.Text);
    });
  });

  describe('when the resource is an annotation (knora-api:Region)', () => {
    it('sets resourceType to Annotation immediately without an API call', () => {
      triggerNgOnChanges(makeAnnotationResource());
      expect(component.resourceType).toBe(ResourceType.Annotation);
      expect(dspApiMock.v2.search.doSearchStillImageRepresentationsCount).not.toHaveBeenCalled();
    });
  });

  describe('when the resource is a segment', () => {
    it('sets resourceType to Segment immediately without an API call', () => {
      triggerNgOnChanges(makeSegmentResource());
      expect(component.resourceType).toBe(ResourceType.Segment);
      expect(dspApiMock.v2.search.doSearchStillImageRepresentationsCount).not.toHaveBeenCalled();
    });
  });

  describe('when the resource has no file value and is not a known class', () => {
    it('shows a spinner (resourceType is null) while the compound count resolves', () => {
      triggerNgOnChanges(makePlainResource());
      expect(component.resourceType).toBeNull();
    });

    it('fires the compound count API call', () => {
      triggerNgOnChanges(makePlainResource());
      expect(dspApiMock.v2.search.doSearchStillImageRepresentationsCount).toHaveBeenCalledWith(
        'http://rdfh.ch/resource1'
      );
    });

    describe('and the compound count is greater than zero', () => {
      it('sets resourceType to Compound and stores the count', () => {
        triggerNgOnChanges(makePlainResource());

        countQuerySubject.next({ numberOfResults: 5 } as CountQueryResponse);

        expect(component.resourceType).toBe(ResourceType.Compound);
        expect(component.compoundCount).toBe(5);
      });

      it('resolves resourceType synchronously after the count arrives', () => {
        triggerNgOnChanges(makePlainResource());
        expect(component.resourceType).toBeNull(); // spinner shown before count

        countQuerySubject.next({ numberOfResults: 3 } as CountQueryResponse);

        expect(component.resourceType).toBe(ResourceType.Compound);
      });
    });

    describe('and the compound count is zero', () => {
      it('sets resourceType to Plain', () => {
        triggerNgOnChanges(makePlainResource());

        countQuerySubject.next({ numberOfResults: 0 } as CountQueryResponse);

        expect(component.resourceType).toBe(ResourceType.Plain);
      });
    });
  });

  describe('when a new resource is set while the compound check is still pending', () => {
    it('cancels the previous compound check and resets to spinner', () => {
      triggerNgOnChanges(makePlainResource());
      expect(component.resourceType).toBeNull();

      // Navigate to an image resource before the count resolves
      triggerNgOnChanges(makeImageResource());

      // The old countQuery result arrives — should be ignored
      countQuerySubject.next({ numberOfResults: 5 } as CountQueryResponse);

      // resourceType should reflect the new image resource, not the stale compound result
      expect(component.resourceType).toBe(ResourceType.Image);
    });
  });

  describe('ngOnDestroy', () => {
    it('completes without error', () => {
      triggerNgOnChanges(makeImageResource());
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
