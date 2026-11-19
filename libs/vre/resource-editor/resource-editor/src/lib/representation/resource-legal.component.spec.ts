import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { NEVER, Observable, of } from 'rxjs';
import { PLACEHOLDER_FILE_SENTINEL } from './is-placeholder-file-value';
import { ResourceFetcherService } from './resource-fetcher.service';
import { ResourceLegalComponent } from './resource-legal.component';

describe('ResourceLegalComponent placeholder rendering (DEV-6982)', () => {
  let fixture: ComponentFixture<ResourceLegalComponent>;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceLegalComponent],
      providers: [
        provideTranslateService(),
        { provide: ResourceFetcherService, useValue: { projectShortcode$: of('0001') } },
        {
          provide: AdminAPIApiService,
          useValue: {
            getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ data: [] }),
          },
        },
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      resourceEditor: {
        legal: {
          copyrightHolder: 'Copyright holder',
          authorship: 'Authorship',
          license: 'License',
          placeholder: 'Placeholder',
        },
      },
    });
    translate.setTranslation('de', {
      resourceEditor: {
        legal: {
          copyrightHolder: 'Urheberrechtsinhaber',
          authorship: 'Autorenschaft',
          license: 'Lizenz',
          placeholder: 'Platzhalter',
        },
      },
    });
    translate.use('en');

    fixture = TestBed.createComponent(ResourceLegalComponent);
    fixture.componentRef.setInput('fileValue', {
      copyrightHolder: PLACEHOLDER_FILE_SENTINEL,
      authorship: ['Ada Lovelace', PLACEHOLDER_FILE_SENTINEL],
      license: null,
    } as unknown as ReadFileValue);
    fixture.detectChanges();
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ').trim();

  it('joins authorship with ", " in the real text node (copy/paste + screen readers)', () => {
    expect(text()).toContain('Ada Lovelace, Placeholder');
    expect(text()).not.toContain('Ada LovelacePlaceholder');
  });

  // Guards that the marker is translated (not a hardcoded string or a raw key) and follows the
  // active language, rather than proving any particular change-detection behaviour.
  it('renders the marker in the active language', () => {
    expect(text()).toContain('Placeholder');

    translate.use('de');
    fixture.detectChanges();

    expect(text()).toContain('Platzhalter');
    expect(text()).toContain('Ada Lovelace, Platzhalter');
    expect(text()).not.toContain('Placeholder');
  });
});

describe('ResourceLegalComponent empty and not-applicable fields', () => {
  const PUBLIC_DOMAIN = 'http://rdfh.ch/licenses/public-domain';
  const CC0 = 'http://rdfh.ch/licenses/cc-0-1.0';
  const AI_GENERATED = 'http://rdfh.ch/licenses/ai-generated';
  const UNKNOWN = 'http://rdfh.ch/licenses/unknown';

  let fixture: ComponentFixture<ResourceLegalComponent>;

  const render = async (
    fileValue: Partial<ReadFileValue>,
    licenses$: Observable<{ data: unknown[] }> = of({ data: [] })
  ) => {
    await TestBed.configureTestingModule({
      imports: [ResourceLegalComponent],
      providers: [
        provideTranslateService(),
        { provide: ResourceFetcherService, useValue: { projectShortcode$: of('0001') } },
        {
          provide: AdminAPIApiService,
          useValue: { getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => licenses$ },
        },
      ],
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      resourceEditor: {
        legal: {
          copyrightHolder: 'Copyright holder',
          authorship: 'Authorship',
          license: 'License',
          placeholder: 'Placeholder',
          notSpecified: 'Not specified',
          notApplicable: 'Not applicable',
        },
      },
    });
    translate.use('en');
    fixture = TestBed.createComponent(ResourceLegalComponent);
    fixture.componentRef.setInput('fileValue', { copyrightHolder: null, authorship: [], license: null, ...fileValue });
    fixture.detectChanges();
  };

  const field = (name: string) =>
    ((fixture.nativeElement as HTMLElement).querySelector(`[data-cy="legal-${name}"]`)?.textContent ?? '').trim();
  const license = (id: string) => ({ id }) as ReadFileValue['license'];

  it('shows the panel with "Not specified" for every field when nothing is recorded', async () => {
    await render({});
    expect(field('copyright-holder')).toBe('Not specified');
    expect(field('authorship')).toBe('Not specified');
    expect(field('license')).toBe('Not specified');
  });

  it('shows recorded values and "Not specified" only for the empty fields', async () => {
    await render({ copyrightHolder: 'University of Basel' });
    expect(field('copyright-holder')).toBe('University of Basel');
    expect(field('authorship')).toBe('Not specified');
  });

  it('shows "Not applicable" for the holder of a public-domain file, authorship stays "Not specified"', async () => {
    await render({ license: license(PUBLIC_DOMAIN) });
    expect(field('copyright-holder')).toBe('Not applicable');
    expect(field('authorship')).toBe('Not specified');
  });

  it('shows "Not applicable" for the holder of a CC0 file', async () => {
    await render({ license: license(CC0) });
    expect(field('copyright-holder')).toBe('Not applicable');
  });

  it('shows "Not applicable" for holder and authorship of an AI-generated file', async () => {
    await render({ license: license(AI_GENERATED) });
    expect(field('copyright-holder')).toBe('Not applicable');
    expect(field('authorship')).toBe('Not applicable');
  });

  it('never hides a recorded holder, even when the license rules the field out', async () => {
    await render({ license: license(PUBLIC_DOMAIN), copyrightHolder: 'Staatsarchiv Basel' });
    expect(field('copyright-holder')).toBe('Staatsarchiv Basel');
  });

  it('shows the recorded license IRI when the catalog does not list it', async () => {
    await render({ license: license(UNKNOWN) });
    expect(field('license')).toBe(UNKNOWN);
  });

  it('shows "Placeholder", not the sentinel, for a placeholder license the catalog does not list', async () => {
    await render({ license: license(PLACEHOLDER_FILE_SENTINEL) });
    expect(field('license')).toBe('Placeholder');
  });

  it('shows neither the IRI nor "Not specified" for the license while the catalog loads', async () => {
    await render({ license: license(UNKNOWN) }, NEVER);
    expect(field('license')).not.toContain(UNKNOWN);
    expect(field('license')).not.toContain('Not specified');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-cy="legal-license"] app-progress-indicator')
    ).toBeTruthy();
  });
});
