import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LegalInfoApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { ProjectDataRightsService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslateService } from '@ngx-translate/core';
import { NEVER, of } from 'rxjs';
import { ResourceSideLegalFormComponent } from './resource-side-legal-form.component';

const CC_BY_40 = 'http://rdfh.ch/licenses/cc-by-4.0';
const CC_BY_NC_40 = 'http://rdfh.ch/licenses/cc-by-nc-4.0';
const CC0_10 = 'http://rdfh.ch/licenses/cc0-1.0';

describe('ResourceSideLegalFormComponent - license dropdown seeding (DEV-6763)', () => {
  let component: ResourceSideLegalFormComponent;
  let fixture: ComponentFixture<ResourceSideLegalFormComponent>;
  let mockLegalInfoApiService: jest.Mocked<LegalInfoApiService>;

  const mockProject = {
    shortcode: '0001',
    id: 'http://rdfh.ch/projects/0001',
    longname: 'Test project',
    dataLicense: CC_BY_40,
    dataCopyrightHolder: 'DaSCH',
    defaultDataAuthorship: ['DaSCH'],
  };

  beforeEach(async () => {
    mockLegalInfoApiService = {
      getLicenses: jest.fn().mockReturnValue(of([])),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ResourceSideLegalFormComponent],
      providers: [
        { provide: LegalInfoApiService, useValue: mockLegalInfoApiService },
        { provide: ProjectDataRightsService, useValue: {} },
        { provide: NotificationService, useValue: { openSnackBar: jest.fn() } },
        { provide: TranslateService, useValue: { instant: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceSideLegalFormComponent);
    component = fixture.componentInstance;
    component.project = mockProject as any;
  });

  it('emits the already-set license synchronously, before the catalog request resolves', () => {
    // getLicenses never emits, so any option present can only come from the synchronous seed.
    mockLegalInfoApiService.getLicenses.mockReturnValue(NEVER);

    component.ngOnInit();

    const emissions: unknown[] = [];
    component.ccLicenses$.subscribe(value => emissions.push(value));

    expect(emissions).toHaveLength(1);
    expect(emissions[0]).toEqual([{ iri: CC_BY_40, summaryKey: 'ccBy40', fallbackLabel: '' }]);
  });

  it('supersedes the seed with the fetched CC-BY licenses once they load', () => {
    mockLegalInfoApiService.getLicenses.mockReturnValue(
      of([
        { id: CC_BY_40, labelEn: 'CC BY 4.0' },
        { id: CC_BY_NC_40, labelEn: 'CC BY-NC 4.0' },
        { id: CC0_10, labelEn: 'CC0 1.0' },
      ] as any)
    );

    component.ngOnInit();

    const emissions: any[] = [];
    component.ccLicenses$.subscribe(value => emissions.push(value));

    // seed first, then the mapped catalog filtered to the CC-BY family (CC0 dropped)
    expect(emissions[0]).toEqual([{ iri: CC_BY_40, summaryKey: 'ccBy40', fallbackLabel: '' }]);
    expect(emissions[emissions.length - 1]).toEqual([
      { iri: CC_BY_40, summaryKey: 'ccBy40', fallbackLabel: 'CC BY 4.0' },
      { iri: CC_BY_NC_40, summaryKey: 'ccByNc40', fallbackLabel: 'CC BY-NC 4.0' },
    ]);
    expect(mockLegalInfoApiService.getLicenses).toHaveBeenCalledWith('0001');
  });

  it('seeds no option when the project has no license set', () => {
    mockLegalInfoApiService.getLicenses.mockReturnValue(NEVER);
    component.project = { ...mockProject, dataLicense: undefined } as any;

    component.ngOnInit();

    const emissions: unknown[] = [];
    component.ccLicenses$.subscribe(value => emissions.push(value));

    expect(emissions).toEqual([[]]);
  });
});
