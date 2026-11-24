import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@dasch-swiss/vre/core/session';
import { BulkEditLauncher, MultipleViewerService, ResourceClassCountApi } from '@dasch-swiss/vre/pages/data-browser';
import { ResourceResultService } from '@dasch-swiss/vre/shared/app-helper-services';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { Observable, of, throwError } from 'rxjs';
import { expect, within } from 'storybook/test';
// eslint-disable-next-line no-restricted-imports -- story-only helpers with the data browser's translations.
import { STORY_PROVIDERS } from '../../../../data-browser/src/lib/stories.helpers';
import { DataClassQueryService } from './data-class-query.service';
import { DataClassResultsBarComponent } from './data-class-results-bar.component';
import { DataClassUrlStateService } from './data-class-url-state.service';
import { ProjectPageService } from './project-page.service';

const CLASS_IRI = 'http://0.0.0.0:3333/ontology/0001/webern/v2#Correspondence';
const PROJECT_IRI = 'http://rdfh.ch/projects/0001';

interface Setup {
  term?: string;
  filters?: string[];
  total?: number;
  classCount?: Observable<number>;
  selected?: number;
  canEdit?: boolean;
}

const providers = ({
  term = '',
  filters = [],
  total = 124,
  classCount = of(3441),
  selected = 0,
  canEdit = true,
}: Setup) => {
  const resourceResult = new ResourceResultService();
  resourceResult.numberOfResults = total;
  const resources = Array.from({ length: selected }, (_, i) => ({
    id: `http://rdfh.ch/0001/r${i}`,
    type: CLASS_IRI,
    attachedToProject: PROJECT_IRI,
  }));
  return [
    ...STORY_PROVIDERS,
    { provide: ResourceResultService, useValue: resourceResult },
    { provide: DataClassUrlStateService, useValue: { fulltextTerm$: of(term), filters$: of(filters) } },
    { provide: DataClassQueryService, useValue: { query$: of('') } },
    { provide: ResourceClassCountApi, useValue: { getResourceClassCount: () => classCount } },
    {
      provide: ProjectPageService,
      useValue: { currentProject: { id: PROJECT_IRI }, hasProjectMemberRights$: of(canEdit) },
    },
    {
      provide: MultipleViewerService,
      useValue: { selectedResources$: of(resources), selectMode: selected > 0, reset: () => {} },
    },
    {
      provide: UserService,
      useValue: { user$: of({ id: 'u1', permissions: { groupsPerProject: {} } }), isSysAdmin$: of(canEdit) },
    },
    { provide: BulkEditLauncher, useValue: { open: () => of(undefined) } },
    { provide: MatDialog, useValue: { open: () => {} } },
  ];
};

const meta: Meta<DataClassResultsBarComponent> = {
  title: 'Data Browser / Results Bar / Scope',
  component: DataClassResultsBarComponent,
  args: {
    classSelected: {
      resClass: { id: CLASS_IRI, labels: [{ language: 'en', value: 'Correspondence' }] },
    } as unknown as DataClassResultsBarComponent['classSelected'],
  },
  argTypes: {
    classSelected: { description: 'The selected class; its total is compared with the filtered count.' },
    bulkEdited: { description: 'Emits once a bulk edit has written values.' },
  },
};
export default meta;
type Story = StoryObj<DataClassResultsBarComponent>;

export const OffersTheWholeClassWithoutFilters: Story = {
  decorators: [applicationConfig({ providers: providers({ total: 3441 }) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('results-scope')).toHaveTextContent('3,441 resources');
    await expect(canvas.getByTestId('download-btn')).toHaveTextContent('Download all 3,441');
    await expect(canvas.getByTestId('bulk-edit-all-btn')).toHaveTextContent('Bulk edit all 3,441');
  },
};

export const OffersWhatTheFiltersKeep: Story = {
  decorators: [applicationConfig({ providers: providers({ filters: ['creator'] }) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('results-scope')).toHaveTextContent(
      '124 of 3,441 resources match your search and filters'
    );
    await expect(canvas.getByTestId('download-btn')).toHaveTextContent('Download 124');
    await expect(canvas.getByTestId('bulk-edit-all-btn')).toHaveTextContent('Bulk edit 124');
  },
};

export const ShowsTheCountAloneWhenTheClassTotalFails: Story = {
  decorators: [
    applicationConfig({
      providers: providers({ term: 'Brief', classCount: throwError(() => new Error('count failed')) }),
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('results-scope')).toHaveTextContent(
      '124 resources match your search and filters'
    );
    await expect(canvas.getByTestId('download-btn')).toHaveTextContent('Download 124');
  },
};

export const OffersTheSelectionWhenRowsAreTicked: Story = {
  decorators: [applicationConfig({ providers: providers({ filters: ['creator'], selected: 2 }) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('selection-bar')).toHaveTextContent('2 resources selected');
    await expect(canvas.getByTestId('download-btn')).toHaveTextContent('Download 2');
    await expect(canvas.getByTestId('bulk-edit-btn')).toHaveTextContent('Bulk edit 2');
    await expect(canvas.queryByTestId('results-bar')).toBeNull();
  },
};

export const HidesBulkEditFromNonMembers: Story = {
  decorators: [applicationConfig({ providers: providers({ filters: ['creator'], canEdit: false }) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('download-btn')).toBeEnabled();
    await expect(canvas.queryByTestId('bulk-edit-all-btn')).toBeNull();
  },
};

export const HidesBulkEditOfASelectionFromNonMembers: Story = {
  decorators: [applicationConfig({ providers: providers({ filters: ['creator'], selected: 2, canEdit: false }) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('download-btn')).toHaveTextContent('Download 2');
    await expect(canvas.queryByTestId('bulk-edit-btn')).toBeNull();
  },
};
