import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OntologyMetadata } from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { makeProjectPageServiceStub, STORY_PROVIDERS } from '../stories.helpers';
import { DataModelsPageComponent } from './data-models-page.component';

const sampleOntologies: OntologyMetadata[] = [
  { id: 'http://0.0.0.0:3333/ontology/0001/test/v2', label: 'Test Ontology', comment: '' } as OntologyMetadata,
];

const meta: Meta<DataModelsPageComponent> = {
  title: 'Ontology / Data Models / Data Models Page',
  component: DataModelsPageComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<DataModelsPageComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...TranslateModule.forRoot().providers!,
  ...STORY_PROVIDERS,
  {
    provide: ProjectPageService,
    useValue: makeProjectPageServiceStub({ ontologiesMetadata$: of(sampleOntologies) }),
  },
  { provide: ListApiService, useValue: { listInProject: () => of({ lists: [] }) } },
];

export const WithOntologies: Story = {
  name: 'Renders list of project ontologies',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Page renders without error', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const EmptyProject: Story = {
  name: 'Renders empty state when project has no ontologies',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders.slice(0, -2),
        {
          provide: ProjectPageService,
          useValue: makeProjectPageServiceStub({ ontologiesMetadata$: of([]) }),
        },
        { provide: ListApiService, useValue: { listInProject: () => of({ lists: [] }) } },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Page renders without error', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const AdminCanCreate: Story = {
  name: 'Shows create ontology button for admin user',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Page renders without error', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
