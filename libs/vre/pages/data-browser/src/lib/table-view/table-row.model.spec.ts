import { ReadResource } from '@dasch-swiss/dsp-js';
import { ProjectDataRights } from '@dasch-swiss/vre/shared/app-helper-services';
import { rightsColumns } from './build-column-model';
import { RIGHTS_COLUMN_KEYS } from './table-column.model';
import { buildRows, RowRights } from './table-row.model';

const PLACEHOLDER = 'urn:dasch:placeholder';

const COLUMNS = rightsColumns({ license: 'License', copyrightHolder: 'Copyright holder', authorship: 'Authorship' });

const RIGHTS: ProjectDataRights = {
  licenseLabel: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  copyrightHolder: 'DaSCH',
  defaultDataAuthorship: ['Project Team'],
  isPlaceholderLicense: false,
  isPlaceholderCopyrightHolder: false,
};

function resource(resourceAuthorship: string[] = []): ReadResource {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/0001/a';
  res.label = 'a';
  res.resourceAuthorship = resourceAuthorship;
  return res;
}

function cells(res: ReadResource, rowRights: RowRights) {
  return buildRows([res], COLUMNS, rowRights)[0].cells;
}

describe('buildRows — rights statement', () => {
  it('ShowsTheProjectsLicenseLinkedToItsDeedAndItsCopyrightHolder', () => {
    const row = cells(resource(), { rights: RIGHTS, placeholderLabel: 'Placeholder' });

    expect(row[RIGHTS_COLUMN_KEYS.license]).toMatchObject({ text: 'CC BY 4.0', href: RIGHTS.licenseUrl });
    expect(row[RIGHTS_COLUMN_KEYS.copyrightHolder]).toMatchObject({ text: 'DaSCH', isEmpty: false });
  });

  it('ShowsTheResourcesOwnAuthorship', () => {
    const row = cells(resource(['Ada', 'Grace']), { rights: RIGHTS, placeholderLabel: 'Placeholder' });

    expect(row[RIGHTS_COLUMN_KEYS.authorship]).toMatchObject({ text: 'Ada, Grace' });
    expect(row[RIGHTS_COLUMN_KEYS.authorship].isFallback).toBeFalsy();
  });

  // As the viewer does: the project's default stands in, marked as such, never as the resource's own.
  it('FallsBackToTheProjectsDefaultAuthorshipMarkedAsAFallback', () => {
    const row = cells(resource(), { rights: RIGHTS, placeholderLabel: 'Placeholder' });

    expect(row[RIGHTS_COLUMN_KEYS.authorship]).toMatchObject({ text: 'Project Team', isFallback: true });
  });

  it('ShowsTheReadableMarkerForPlaceholderValues', () => {
    const rights: ProjectDataRights = {
      ...RIGHTS,
      licenseLabel: undefined,
      licenseUrl: undefined,
      copyrightHolder: PLACEHOLDER,
      isPlaceholderLicense: true,
      isPlaceholderCopyrightHolder: true,
    };

    const row = cells(resource([PLACEHOLDER]), { rights, placeholderLabel: 'Placeholder' });

    expect(row[RIGHTS_COLUMN_KEYS.license]).toMatchObject({ text: 'Placeholder' });
    expect(row[RIGHTS_COLUMN_KEYS.license].href).toBeUndefined();
    expect(row[RIGHTS_COLUMN_KEYS.copyrightHolder]).toMatchObject({ text: 'Placeholder' });
    expect(row[RIGHTS_COLUMN_KEYS.authorship]).toMatchObject({ text: 'Placeholder' });
  });

  it('ReportsAFieldTheProjectHasNotSetAsEmpty', () => {
    const rights: ProjectDataRights = {
      ...RIGHTS,
      licenseLabel: undefined,
      licenseUrl: undefined,
      copyrightHolder: undefined,
    };

    const row = cells(resource(), { rights, placeholderLabel: 'Placeholder' });

    expect(row[RIGHTS_COLUMN_KEYS.license].isEmpty).toBe(true);
    expect(row[RIGHTS_COLUMN_KEYS.copyrightHolder].isEmpty).toBe(true);
  });

  // Not "not set" while the project's legal info is still loading: it may well be set.
  it('LeavesTheProjectsFieldsBlankUntilItsRightsHaveLoaded', () => {
    const row = cells(resource(['Ada']), { placeholderLabel: 'Placeholder' });

    expect(row[RIGHTS_COLUMN_KEYS.license]).toMatchObject({ text: '', isEmpty: false });
    expect(row[RIGHTS_COLUMN_KEYS.copyrightHolder]).toMatchObject({ text: '', isEmpty: false });
    expect(row[RIGHTS_COLUMN_KEYS.authorship]).toMatchObject({ text: 'Ada' });
  });
});
