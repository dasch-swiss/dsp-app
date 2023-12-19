import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { ResourceService } from './resource.service';

describe('ResourceService with iriBase = http://rdfh.ch', () => {
  let service: ResourceService;

  const appInitSpy = {
    dspAppConfig: {
      iriBase: 'http://rdfh.ch',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppConfigService,
          useValue: appInitSpy,
        },
      ],
    });
    service = TestBed.inject(ResourceService);
    expect(service).toBeTruthy();
  });

  it('should return the resource iri from project code and resource uuid', () => {
    const iri = service.getResourceIri('082B', 'SQkTPdHdTzq_gqbwj6QR-A');
    expect(iri).toEqual('http://rdfh.ch/082B/SQkTPdHdTzq_gqbwj6QR-A');
  });

  it("should return the app's resource path from project iri", () => {
    const path = service.getResourcePath('http://rdfh.ch/082B/SQkTPdHdTzq_gqbwj6QR-A');
    expect(path).toEqual('/082B/SQkTPdHdTzq_gqbwj6QR-A');
  });
});

// if the iriBase has an slash at the end
describe('ResourceService with iriBase = http://rdfh.ch/', () => {
  let service: ResourceService;

  const appInitSpy = {
    dspAppConfig: {
      iriBase: 'http://rdfh.ch/',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppConfigService,
          useValue: appInitSpy,
        },
      ],
    });
    service = TestBed.inject(ResourceService);
    expect(service).toBeTruthy();
  });

  it('should return the resource iri from project code and resource uuid', () => {
    const iri = service.getResourceIri('082B', 'SQkTPdHdTzq_gqbwj6QR-A');
    expect(iri).toEqual('http://rdfh.ch/082B/SQkTPdHdTzq_gqbwj6QR-A');
  });

  it("should return the app's resource path from project iri", () => {
    const path = service.getResourcePath('http://rdfh.ch/082B/SQkTPdHdTzq_gqbwj6QR-A');
    expect(path).toEqual('/082B/SQkTPdHdTzq_gqbwj6QR-A');
  });
});
