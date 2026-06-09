import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { LocalizationService, OntologyService, SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { OntologyPageComponent } from './ontology-page.component';
import { makeProjectPageServiceStub, STORY_PROVIDERS } from './stories.helpers';

const sampleOntology = {
  id: 'http://0.0.0.0:3333/ontology/0001/test/v2',
  label: 'Test Ontology',
  lastModificationDate: '2024-03-15T10:30:00Z',
  comment: '',
  getAllClassDefinitions: () => [],
  getAllPropertyDefinitions: () => [],
  getPropertyDefinitionsByType: () => [],
  getClassDefinitionsByType: () => [],
} as unknown as any;

const meta: Meta<OntologyPageComponent> = {
  title: 'Ontology Editor',
  component: OntologyPageComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<OntologyPageComponent>;

const sharedProviders = [
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ ontologies$: of([sampleOntology]) }) },
  { provide: ListApiService, useValue: { listInProject: () => of({ lists: [] }) } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  {
    provide: DspApiConnectionToken,
    useValue: {
      v2: {
        onto: {
          canDeleteOntology: () => of({ canDo: false }),
          getOntology: () => of(sampleOntology),
        },
      },
    },
  },
  { provide: LocalizationService, useValue: { currentLanguage: 'en', currentLanguage$: of('en') } },
  {
    provide: OntologyService,
    useValue: {
      getDefaultProperty: () => ({}),
      getIriBaseUrl: () => 'http://0.0.0.0:3333',
      getInPreferedLanguage: () => '',
    },
  },
  { provide: SortingHelper, useValue: { sortByLabelsAlphabetically: (arr: any[]) => arr } },
];

export const DefaultView: Story = {
  name: 'Renders ontology editor layout with header and sidenav',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Ontology page container renders', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
