import { JsonConvert, OperationMode, PropertyMatchingRule, ValueCheckingMode } from 'json2typescript';
import { of } from 'rxjs';
import { ResourceClassAndPropertyDefinitions } from '../../../../../cache/ontology-cache/resource-class-and-property-definitions';
import { KnoraApiConfig } from '../../../../../knora-api-config';
import { KnoraApiConnection } from '../../../../../knora-api-connection';
import { Constants } from '../../../Constants';
import { ResourcePropertyDefinition } from '../../../ontologies/resource-property-definition';
import { ResourcesConversionUtil } from '../../ResourcesConversionUtil';
import { ReadResourceSequence } from '../../read/read-resource-sequence';
import { CreateRegionPreviewValue } from '../create/create-region-preview-value';
import { UpdateRegionPreviewValue } from '../update/update-region-preview-value';
import { ReadRegionPreviewValue } from './read-region-preview-value';

const REGION_IRI = 'http://rdfh.ch/0001/some-region';
const FULL_IMAGE_IRI = 'http://rdfh.ch/0001/some-image';
const CROP_URL = 'http://0.0.0.0:1024/0001/crop.jp2/0,0,100,100/max/0/default.jpg';
const THUMB_URL = 'http://0.0.0.0:1024/0001/img.jp2/full/,512/0/default.jpg';

const anyUri = (value: string) => ({ '@type': Constants.XsdAnyUri, '@value': value });
const decimal = (value: string) => ({ '@type': Constants.XsdDecimal, '@value': value });

/** The required ReadValue base fields every value node carries. */
const baseValueFields = () => ({
  '@id': 'http://rdfh.ch/0001/res/values/rp1',
  '@type': Constants.RegionPreviewValue,
  [Constants.AttachedToUser]: { '@id': 'http://rdfh.ch/users/user1' },
  [Constants.ArkUrl]: anyUri('http://0.0.0.0:3336/ark:/72163/1/0001/rp1'),
  [Constants.VersionArkUrl]: anyUri('http://0.0.0.0:3336/ark:/72163/1/0001/rp1.20260101'),
  [Constants.ValueCreationDate]: { '@type': Constants.dateTimeStamp, '@value': '2026-07-01T00:00:00Z' },
  [Constants.HasPermissions]: 'CR knora-admin:Creator|V knora-admin:UnknownUser',
  [Constants.UserHasPermission]: 'CR',
  [Constants.ValueHasUUID]: 'rp1',
});

/** The RegionPreview-specific fields (anyURI/decimal arrive as typed literals). */
const regionFields = (authorship: string | string[] = ['Ada Lovelace']) => ({
  [Constants.IsRegionPreviewOf]: { '@id': REGION_IRI },
  [Constants.HasPreviewCropUrl]: anyUri(CROP_URL),
  [Constants.HasPreviewThumbnailUrl]: anyUri(THUMB_URL),
  [Constants.HasPreviewHighlightBoxX]: decimal('10'),
  [Constants.HasPreviewHighlightBoxY]: decimal('20'),
  [Constants.HasPreviewHighlightBoxW]: decimal('30'),
  [Constants.HasPreviewHighlightBoxH]: decimal('40'),
  [Constants.HasPreviewColor]: '#ff3333',
  [Constants.HasPreviewFullImage]: {
    '@id': FULL_IMAGE_IRI,
    '@type': Constants.StillImageFileValue,
    [Constants.Label]: 'Source page 42',
  },
  [Constants.hasCopyrightHolder]: 'DaSCH',
  [Constants.hasAuthorship]: authorship,
  [Constants.hasLicense]: { '@id': 'http://rdfh.ch/licenses/cc-by-4.0' },
});

const jsonConvert: JsonConvert = new JsonConvert(
  OperationMode.ENABLE,
  ValueCheckingMode.DISALLOW_NULL,
  false,
  PropertyMatchingRule.CASE_STRICT
);

describe('ReadRegionPreviewValue', () => {
  describe('deserialize (converters)', () => {
    it('parses anyURI/decimal typed literals into the computed image-tier fields (guards R8)', () => {
      const node = { ...baseValueFields(), ...regionFields() };

      const rp = jsonConvert.deserialize(node, ReadRegionPreviewValue) as ReadRegionPreviewValue;

      expect(rp instanceof ReadRegionPreviewValue).toBe(true);
      // anyURI typed literals -> plain strings
      expect(rp.cropUrl).toEqual(CROP_URL);
      expect(rp.thumbnailUrl).toEqual(THUMB_URL);
      // decimal typed literals -> numbers
      expect(rp.highlightBoxX).toEqual(10);
      expect(rp.highlightBoxY).toEqual(20);
      expect(rp.highlightBoxW).toEqual(30);
      expect(rp.highlightBoxH).toEqual(40);
      // the region's color -> plain hex string
      expect(rp.color).toEqual('#ff3333');
      // legal fields
      expect(rp.copyrightHolder).toEqual('DaSCH');
      expect(rp.authorship).toEqual(['Ada Lovelace']);
      expect(rp.license?.id).toEqual('http://rdfh.ch/licenses/cc-by-4.0');
    });

    it('coerces a single hasAuthorship scalar into an array', () => {
      const node = { ...baseValueFields(), ...regionFields('Ada Lovelace') };

      const rp = jsonConvert.deserialize(node, ReadRegionPreviewValue) as ReadRegionPreviewValue;

      expect(rp.authorship).toEqual(['Ada Lovelace']);
    });
  });

  describe('serialize (create/update round-trip)', () => {
    it('serializes CreateRegionPreviewValue with isRegionPreviewOf as an @id reference', () => {
      const create = new CreateRegionPreviewValue();
      create.regionIri = REGION_IRI;

      const serialized = jsonConvert.serialize(create) as { [key: string]: unknown };

      expect(serialized['@type']).toEqual(Constants.RegionPreviewValue);
      expect(serialized[Constants.IsRegionPreviewOf]).toEqual({ '@id': REGION_IRI });
    });

    it('serializes UpdateRegionPreviewValue with its id and isRegionPreviewOf reference', () => {
      const update = new UpdateRegionPreviewValue();
      update.id = 'http://rdfh.ch/0001/res/values/rp1';
      update.regionIri = REGION_IRI;

      const serialized = jsonConvert.serialize(update) as { [key: string]: unknown };

      expect(serialized['@id']).toEqual('http://rdfh.ch/0001/res/values/rp1');
      expect(serialized['@type']).toEqual(Constants.RegionPreviewValue);
      expect(serialized[Constants.IsRegionPreviewOf]).toEqual({ '@id': REGION_IRI });
    });
  });

  describe('ResourcesConversionUtil (full read path)', () => {
    const config = new KnoraApiConfig('http', '0.0.0.0', 3333, undefined, '', true);
    const RES_TYPE = 'http://0.0.0.0:3333/ontology/0001/anything/v2#Thing';
    const PROP_IRI = 'http://0.0.0.0:3333/ontology/0001/anything/v2#hasRegionPreview';
    let knoraApiConnection: KnoraApiConnection;

    beforeEach(() => {
      knoraApiConnection = new KnoraApiConnection(config);

      const propDef = new ResourcePropertyDefinition();
      propDef.id = PROP_IRI;
      propDef.label = 'Region preview';
      propDef.comment = 'A preview of a region';

      jest
        .spyOn(knoraApiConnection.v2.ontologyCache, 'getResourceClassDefinition')
        .mockImplementation(() => of(new ResourceClassAndPropertyDefinitions({}, { [PROP_IRI]: propDef })));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const resourceJsonld = () => ({
      '@id': 'http://rdfh.ch/0001/res',
      '@type': RES_TYPE,
      [Constants.Label]: 'A resource',
      [Constants.AttachedToProject]: { '@id': 'http://rdfh.ch/projects/0001' },
      [Constants.AttachedToUser]: { '@id': 'http://rdfh.ch/users/user1' },
      [Constants.HasPermissions]: 'CR knora-admin:Creator|V knora-admin:UnknownUser',
      [Constants.UserHasPermission]: 'CR',
      [Constants.ArkUrl]: anyUri('http://0.0.0.0:3336/ark:/72163/1/0001/res'),
      [Constants.VersionArkUrl]: anyUri('http://0.0.0.0:3336/ark:/72163/1/0001/res.20260101'),
      [Constants.CreationDate]: { '@type': Constants.dateTimeStamp, '@value': '2026-07-01T00:00:00Z' },
      [PROP_IRI]: { ...baseValueFields(), ...regionFields() },
    });

    it('parses a RegionPreviewValue into a typed ReadRegionPreviewValue (not a bare ReadValue) with computed + reference fields', done => {
      ResourcesConversionUtil.createReadResourceSequence(
        resourceJsonld(),
        knoraApiConnection.v2.ontologyCache,
        knoraApiConnection.v2.listNodeCache,
        jsonConvert
      ).subscribe((resSeq: ReadResourceSequence) => {
        expect(resSeq.resources.length).toEqual(1);
        const values = resSeq.resources[0].getValues(PROP_IRI);
        expect(values.length).toEqual(1);

        const rp = values[0];
        expect(rp instanceof ReadRegionPreviewValue).toBe(true);

        const typed = rp as ReadRegionPreviewValue;
        // imperatively-set reference fields (A3)
        expect(typed.regionIri).toEqual(REGION_IRI);
        expect(typed.fullImageIri).toEqual(FULL_IMAGE_IRI);
        expect(typed.fullImageLabel).toEqual('Source page 42');
        expect(typed.strval).toEqual('Source page 42');
        // decorated computed fields survive the full path
        expect(typed.cropUrl).toEqual(CROP_URL);
        expect(typed.highlightBoxW).toEqual(30);
        expect(typed.color).toEqual('#ff3333');
        // generic post-processing
        expect(typed.property).toEqual(PROP_IRI);
        done();
      });
    });
  });
});
