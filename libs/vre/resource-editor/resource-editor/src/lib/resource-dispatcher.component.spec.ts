import { ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cardinality, Constants, CountQueryResponse, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { of, Subject } from 'rxjs';
import { ResourceDispatcherComponent } from './resource-dispatcher.component';
import { ResourceType } from './resource-type';

const DEFAULT_CLASS = 'http://example.org/onto#SomeClass';

/**
 * Builds the `entityInfo` a real `ReadResource` always carries.
 *
 * `ResourcesConversionUtil.createReadResource()` assigns it unconditionally from the ontology
 * cache, so a resource holding a file value in `properties` always also declares that
 * property's cardinality on its class — the two are never independent.
 */
const makeEntityInfo = (resourceType: string, propertyIris: string[]) =>
  ({
    classes: {
      [resourceType]: {
        propertiesList: propertyIris.map(propertyIndex => ({
          propertyIndex,
          cardinality: Cardinality._0_1,
          isInherited: false,
        })),
      },
    },
    properties: {},
  }) as unknown as ReadResource['entityInfo'];

// Minimal resource factory. `filePropertyIris` are the file-value cardinalities the class
// declares; they default to the keys present in `properties` so fixtures stay in step.
const makeResource = (overrides: Partial<ReadResource> = {}, filePropertyIris?: string[]): DspResource => {
  const type = (overrides.type as string) ?? DEFAULT_CLASS;
  const properties = overrides.properties ?? {};
  return {
    res: {
      id: 'http://rdfh.ch/resource1',
      type,
      properties,
      entityInfo: makeEntityInfo(type, filePropertyIris ?? Object.keys(properties)),
      ...overrides,
    } as unknown as ReadResource,
  } as unknown as DspResource;
};

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

const makeAnnotationResource = (): DspResource => makeResource({ type: Constants.Region, properties: {} });

const makeSegmentResource = (): DspResource =>
  makeResource({
    type: 'http://api.knora.org/ontology/knora-api/v2#VideoSegment',
    properties: {},
  });

const makePlainResource = (): DspResource => makeResource({ type: DEFAULT_CLASS, properties: {} });

/**
 * A representation whose file value is withheld (DEV-7072): `properties` is empty because
 * dsp-api drops unreadable values and removes the property key, while the class still declares
 * the cardinality — which is what identifies it as a representation.
 */
const makeWithheldRepresentation = (filePropertyIri: string): DspResource =>
  makeResource({ type: DEFAULT_CLASS, properties: {}, userHasPermission: 'V' }, [filePropertyIri]);

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

  describe('when the resource is a video segment', () => {
    it('sets resourceType to VideoSegment immediately without an API call', () => {
      triggerNgOnChanges(makeSegmentResource());
      expect(component.resourceType).toBe(ResourceType.VideoSegment);
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
  describe('when the resource is a representation whose file value is withheld (DEV-7072)', () => {
    it('sets resourceType synchronously, so the media wrapper can show the restricted notice', () => {
      triggerNgOnChanges(makeWithheldRepresentation(Constants.HasMovingImageFileValue));
      expect(component.resourceType).toBe(ResourceType.Video);
    });

    it('does not fall through to the compound count API call', () => {
      triggerNgOnChanges(makeWithheldRepresentation(Constants.HasStillImageFileValue));
      expect(component.resourceType).toBe(ResourceType.Image);
      expect(dspApiMock.v2.search.doSearchStillImageRepresentationsCount).not.toHaveBeenCalled();
    });

    it('never renders the plain view for a withheld representation', () => {
      triggerNgOnChanges(makeWithheldRepresentation(Constants.HasTextFileValue));
      expect(component.resourceType).not.toBe(ResourceType.Plain);
      expect(component.resourceType).toBe(ResourceType.Text);
    });
  });
});
