import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Constants, ReadStillImageFileValue } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspResource, PLACEHOLDER_IRI } from '@dasch-swiss/vre/shared/app-common';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { ResourceFetcherService } from '../representations/resource-fetcher.service';
import { CompoundViewerComponent } from './compound-viewer.component';
import { CompoundService } from './compound.service';

describe('CompoundViewerComponent placeholder branch', () => {
  let fixture: ComponentFixture<CompoundViewerComponent>;
  let incomingResource$: BehaviorSubject<DspResource | undefined>;

  function makeIncoming(filename: string): DspResource {
    const fileValue = {
      type: Constants.StillImageFileValue,
      filename,
    } as ReadStillImageFileValue;
    return {
      res: {
        id: 'http://rdfh.ch/0001/page',
        type: 'http://example.com/Page',
        label: 'page',
        properties: {
          [Constants.HasStillImageFileValue]: [fileValue],
        },
      },
    } as unknown as DspResource;
  }

  beforeEach(async () => {
    incomingResource$ = new BehaviorSubject<DspResource | undefined>(undefined);
    const compoundServiceMock = { incomingResource$: incomingResource$.asObservable() };

    await TestBed.configureTestingModule({
      imports: [CompoundViewerComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: CompoundService, useValue: compoundServiceMock },
        {
          provide: AdminAPIApiService,
          useValue: {
            getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: jest.fn().mockReturnValue(of({ data: [] })),
          },
        },
        { provide: ResourceFetcherService, useValue: { projectShortcode$: of('0001') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompoundViewerComponent);
  });

  it('renders the placeholder card and not still-image when the incoming page is a placeholder', () => {
    incomingResource$.next(makeIncoming(PLACEHOLDER_IRI));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-placeholder-representation')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-still-image')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-vector-image')).toBeNull();
  });
});
