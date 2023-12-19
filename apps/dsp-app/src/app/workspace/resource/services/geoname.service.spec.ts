import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DisplayPlace, GeonameService } from './geoname.service';

const geonamesGetResponse = {
  timezone: { gmtOffset: 1, timeZoneId: 'Europe/Zurich', dstOffset: 2 },
  asciiName: 'Zuerich Enge',
  astergdem: 421,
  countryId: '2658434',
  fcl: 'S',
  srtm3: 412,
  adminId2: '6458798',
  adminId3: '7287650',
  countryCode: 'CH',
  adminCodes1: { ISO3166_2: 'ZH' },
  adminId1: '2657895',
  lat: '47.3641',
  fcode: 'RSTN',
  continentCode: 'EU',
  adminCode2: '112',
  adminCode3: '261',
  adminCode1: 'ZH',
  lng: '8.53081',
  geonameId: 11963110,
  toponymName: 'Zürich Enge',
  population: 0,
  wikipediaURL: 'en.wikipedia.org/wiki/Z%C3%BCrich_Enge_railway_station',
  adminName5: '',
  adminName4: '',
  adminName3: 'Zurich',
  alternateNames: [
    {
      name: '8503010',
      lang: 'uicn',
    },
    {
      name: 'https://en.wikipedia.org/wiki/Z%C3%BCrich_Enge_railway_station',
      lang: 'link',
    },
    {
      name: 'ZEN',
      lang: 'abbr',
    },
    { isShortName: true, isPreferredName: true, name: 'Zürich Enge' },
  ],
  adminName2: 'Zürich District',
  name: 'Zürich Enge',
  fclName: 'spot, building, farm',
  countryName: 'Switzerland',
  fcodeName: 'railroad station',
  adminName1: 'Zurich',
};

const geonamesSearchResponse = {
  totalResultsCount: 203,
  geonames: [
    {
      timezone: {
        gmtOffset: 1,
        timeZoneId: 'Europe/Zurich',
        dstOffset: 2,
      },
      bbox: {
        east: 7.634148441523814,
        south: 47.523628289543254,
        north: 47.58955415634046,
        west: 7.554659665553558,
        accuracyLevel: 10,
      },
      asciiName: 'Basel',
      astergdem: 287,
      countryId: '2658434',
      fcl: 'P',
      srtm3: 279,
      score: 23.979536056518555,
      adminId2: '6458763',
      adminId3: '7285161',
      countryCode: 'CH',
      adminCodes1: { ISO3166_2: 'BS' },
      adminId1: '2661602',
      lat: '47.55839',
      fcode: 'PPLA',
      continentCode: 'EU',
      adminCode2: '1200',
      adminCode3: '2701',
      adminCode1: 'BS',
      lng: '7.57327',
      geonameId: 2661604,
      toponymName: 'Basel',
      population: 164488,
      adminName5: '',
      adminName4: '',
      adminName3: 'Basel',
      alternateNames: [
        { name: 'Basel', lang: 'als' },
        { name: 'ባዝል', lang: 'am' },
        {
          name: 'بازل',
          lang: 'ar',
        },
        { name: 'بازل', lang: 'arz' },
        { name: 'بازل', lang: 'azb' },
        {
          name: 'Базель',
          lang: 'be',
        },
        { name: 'Базел', lang: 'bg' },
        { name: 'বাজেল', lang: 'bn' },
        {
          name: 'པ་སེལ།',
          lang: 'bo',
        },
        { name: 'Basel', lang: 'bs' },
        { name: 'Basilea', lang: 'ca' },
        {
          name: 'Базель',
          lang: 'ce',
        },
        { name: 'بازل', lang: 'ckb' },
        { name: 'Basilej', lang: 'cs' },
        {
          name: 'Базель',
          lang: 'cv',
        },
        { name: 'Basel', lang: 'da' },
        { name: 'Basel', lang: 'de' },
        {
          name: 'Βασιλεία',
          lang: 'el',
        },
        { name: 'Basel', lang: 'en' },
        { name: 'Bazelo', lang: 'eo' },
        {
          name: 'Basilea',
          lang: 'es',
        },
        { name: 'بازل', lang: 'fa' },
        { name: 'Basel', lang: 'fi' },
        {
          name: 'Bâle',
          lang: 'fr',
        },
        { name: 'Bâla', lang: 'frp' },
        { name: 'Bāsel', lang: 'frr' },
        {
          name: 'בזל',
          lang: 'he',
        },
        { name: 'Bázel', lang: 'hu' },
        { name: 'Բազել', lang: 'hy' },
        {
          isPreferredName: true,
          name: 'BSL',
          lang: 'iata',
        },
        { name: 'Basel', lang: 'id' },
        { name: 'Basilea', lang: 'it' },
        {
          name: 'バーゼル',
          lang: 'ja',
        },
        { name: 'ბაზელი', lang: 'ka' },
        { name: 'Базель', lang: 'kk' },
        {
          name: '바젤',
          lang: 'ko',
        },
        { name: 'Robur', lang: 'la' },
        {
          name: 'https://en.wikipedia.org/wiki/Basel',
          lang: 'link',
        },
        { name: 'Bazelis', lang: 'lt' },
        { name: 'Bāzele', lang: 'lv' },
        {
          name: 'Базел',
          lang: 'mk',
        },
        { name: 'Базель хот', lang: 'mn' },
        { name: 'बासल', lang: 'mr' },
        {
          name: 'Bazel',
          lang: 'nl',
        },
        { name: 'Basel', lang: 'nn' },
        { name: 'Basel', lang: 'no' },
        {
          name: 'Basilèa',
          lang: 'oc',
        },
        { name: 'Базель', lang: 'os' },
        { name: 'Bazylea', lang: 'pl' },
        {
          isPreferredName: true,
          name: '4000',
          lang: 'post',
        },
        { name: 'Basileia', lang: 'pt' },
        { name: 'Basilea', lang: 'rm' },
        {
          name: 'Basel',
          lang: 'ro',
        },
        { name: 'Базель', lang: 'ru' },
        { name: 'Bazilej', lang: 'sk' },
        {
          name: 'Basel',
          lang: 'sl',
        },
        { name: 'Bazeli', lang: 'sq' },
        { name: 'Базел', lang: 'sr' },
        {
          name: 'Basel',
          lang: 'sv',
        },
        { name: 'பேசெல்', lang: 'ta' },
        { name: 'บาเซิล', lang: 'th' },
        {
          name: 'Basel',
          lang: 'tr',
        },
        { name: 'Базель', lang: 'uk' },
        { name: 'CHBSL', lang: 'unlc' },
        {
          name: 'بازل',
          lang: 'ur',
        },
        { name: 'Baxiłea', lang: 'vec' },
        { name: '白才尔', lang: 'wuu' },
        {
          name: 'באזעל',
          lang: 'yi',
        },
        { name: '巴塞爾', lang: 'yue' },
        { name: '巴塞尔', lang: 'zh' },
        { name: '巴塞尔', lang: 'zh-CN' },
      ],
      adminName2: 'Basel-City',
      name: 'Basel',
      fclName: 'city, village,...',
      countryName: 'Schweiz',
      fcodeName: 'seat of a first-order administrative division',
      adminName1: 'Basel-Stadt',
    },
    {
      timezone: {
        gmtOffset: 1,
        timeZoneId: 'Europe/Brussels',
        dstOffset: 2,
      },
      bbox: {
        east: 4.328900686384307,
        south: 51.12543286042041,
        north: 51.169661437124496,
        west: 4.23076509693852,
        accuracyLevel: 10,
      },
      asciiName: 'Bazel',
      astergdem: 10,
      countryId: '2802361',
      fcl: 'P',
      srtm3: 14,
      score: 21.20476722717285,
      adminId2: '2789733',
      adminId3: '2786577',
      countryCode: 'BE',
      adminId4: '2793941',
      adminCodes2: { ISO3166_2: 'VOV' },
      adminCodes1: { ISO3166_2: 'VLG' },
      adminId1: '3337388',
      lat: '51.14741',
      fcode: 'PPL',
      continentCode: 'EU',
      adminCode2: 'VOV',
      adminCode3: '46',
      adminCode1: 'VLG',
      lng: '4.30129',
      geonameId: 2802529,
      toponymName: 'Bazel',
      adminCode4: '46013',
      population: 5687,
      adminName5: '',
      adminName4: 'Kruibeke',
      adminName3: 'Arrondissement Sint-Niklaas',
      alternateNames: [
        { name: 'https://en.wikipedia.org/wiki/Bazel', lang: 'link' },
        {
          name: '9150',
          lang: 'post',
        },
        { name: 'BEBAZ', lang: 'unlc' },
      ],
      adminName2: 'Provinz Ostflandern',
      name: 'Basel',
      fclName: 'city, village,...',
      countryName: 'Belgien',
      fcodeName: 'populated place',
      adminName1: 'Flandern',
    },
  ],
};

describe('GeonameService', () => {
  let service: GeonameService;
  let httpTestingController: HttpTestingController;

  const appInitSpy = {
    dspAppConfig: {
      geonameToken: 'token',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: AppConfigService,
          useValue: appInitSpy,
        },
      ],
    });

    service = TestBed.inject(GeonameService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Method resolveGeonameID', () => {
    it('should resolve a given geoname id', done => {
      service
        .resolveGeonameID('2661604')
        .subscribe((displayPlace: DisplayPlace) => {
          expect(displayPlace.displayName).toEqual(
            'Zürich Enge, Zurich, Switzerland'
          );
          done();
        });

      const httpRequest = httpTestingController.expectOne(
        'https://ws.geonames.net/getJSON?geonameId=2661604&username=token&style=short'
      );

      expect(httpRequest.request.method).toEqual('GET');

      const expectedResponse = geonamesGetResponse;

      httpRequest.flush(expectedResponse);
    });

    it('should return an error if the requests fails', done => {
      service.resolveGeonameID('2661604').subscribe(
        () => {},
        () => {
          done();
        }
      );

      const httpRequest = httpTestingController.expectOne(
        'https://ws.geonames.net/getJSON?geonameId=2661604&username=token&style=short'
      );

      expect(httpRequest.request.method).toEqual('GET');

      const mockErrorResponse = {
        status: 400,
        statusText: 'Bad Request',
      };

      httpRequest.flush(mockErrorResponse);
    });

    it('should return an error if the requests response does not contain the expected information', done => {
      service.resolveGeonameID('2661604').subscribe(
        () => {},
        () => {
          done();
        }
      );

      const httpRequest = httpTestingController.expectOne(
        'https://ws.geonames.net/getJSON?geonameId=2661604&username=token&style=short'
      );

      expect(httpRequest.request.method).toEqual('GET');

      const expectedResponse = { place: 'Basel' };

      httpRequest.flush(expectedResponse);
    });

    describe('Method searchPlace', () => {
      it('should search for a place', done => {
        service.searchPlace('Basel').subscribe(places => {
          expect(places.length).toEqual(2);

          const placeBasel = places[0];
          expect(placeBasel.displayName).toEqual('Basel, Basel-Stadt, Schweiz');
          expect(placeBasel.id).toEqual('2661604');

          done();
        });

        const httpRequest = httpTestingController.expectOne(
          'https://ws.geonames.net/searchJSON?userName=token&lang=en&style=full&maxRows=12&name_startsWith=Basel'
        );

        expect(httpRequest.request.method).toEqual('GET');

        const expectedResponse = geonamesSearchResponse;

        httpRequest.flush(expectedResponse);
      });

      it('should return an error if the requests fails', done => {
        service.searchPlace('Basel').subscribe(
          () => {},
          () => {
            done();
          }
        );

        const httpRequest = httpTestingController.expectOne(
          'https://ws.geonames.net/searchJSON?userName=token&lang=en&style=full&maxRows=12&name_startsWith=Basel'
        );

        expect(httpRequest.request.method).toEqual('GET');

        const mockErrorResponse = {
          status: 400,
          statusText: 'Bad Request',
        };

        httpRequest.flush(mockErrorResponse);
      });

      it('should return an error if the requests response does not contain the expected information', done => {
        service.searchPlace('Basel').subscribe(
          () => {},
          () => {
            done();
          }
        );

        const httpRequest = httpTestingController.expectOne(
          'https://ws.geonames.net/searchJSON?userName=token&lang=en&style=full&maxRows=12&name_startsWith=Basel'
        );

        expect(httpRequest.request.method).toEqual('GET');

        const expectedResponse = { place: 'Basel' };

        httpRequest.flush(expectedResponse);
      });
    });
  });
});
