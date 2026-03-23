import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadAudioFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { ResourceUtil } from '../resource.util';
import { AudioMoreButtonComponent } from './audio-more-button.component';

describe('AudioMoreButtonComponent', () => {
  let component: AudioMoreButtonComponent;
  let fixture: ComponentFixture<AudioMoreButtonComponent>;

  const mockAudioFileValue = {
    id: 'http://rdf.dasch.swiss/0001/test-audio',
    type: Constants.AudioFileValue,
    fileUrl: 'http://example.com/audio.mp3',
    userHasPermission: 'V',
  } as unknown as ReadAudioFileValue;

  const mockParentResource = {
    id: 'http://rdf.dasch.swiss/0001/test-resource',
    type: 'http://www.knora.org/ontology/knora-api/v2#Resource',
    label: 'Test Resource',
    properties: {
      [Constants.HasAudioFileValue]: [mockAudioFileValue],
    },
  } as unknown as ReadResource;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioMoreButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideTranslateService(),
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: RepresentationService, useValue: { downloadProjectFile: jest.fn() } },
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioMoreButtonComponent);
    component = fixture.componentInstance;
    component.parentResource = mockParentResource;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('userCanView', () => {
    it('returns false when userHasPermission is RV', () => {
      jest.spyOn(component, 'fileValue', 'get').mockReturnValue({ userHasPermission: 'RV' } as ReadAudioFileValue);
      expect(component.userCanView).toBe(false);
    });

    it('returns true when userHasPermission is V', () => {
      jest.spyOn(component, 'fileValue', 'get').mockReturnValue({ userHasPermission: 'V' } as ReadAudioFileValue);
      expect(component.userCanView).toBe(true);
    });

    it('returns true when userHasPermission is M', () => {
      jest.spyOn(component, 'fileValue', 'get').mockReturnValue({ userHasPermission: 'M' } as ReadAudioFileValue);
      expect(component.userCanView).toBe(true);
    });
  });

  describe('userCanView delegates to ResourceUtil', () => {
    it('calls ResourceUtil.userCanView with the file value', () => {
      const spy = jest.spyOn(ResourceUtil, 'userCanView').mockReturnValue(true);
      jest.spyOn(component, 'fileValue', 'get').mockReturnValue(mockAudioFileValue);

      component.userCanView;

      expect(spy).toHaveBeenCalledWith(mockAudioFileValue);
    });
  });
});
