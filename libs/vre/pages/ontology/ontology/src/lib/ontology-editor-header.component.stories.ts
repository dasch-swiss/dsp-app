import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OntologyMetadata } from '@dasch-swiss/dsp-js';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { OntologyEditorHeaderComponent } from './ontology-editor-header.component';
import { OntologyEditService } from './services/ontology-edit.service';
import { makeOntologyEditServiceStub, makeProjectPageServiceStub, STORY_PROVIDERS } from './stories.helpers';

const sampleOntologyMeta = {
  id: 'http://0.0.0.0:3333/ontology/0001/test/v2',
  label: 'Test Ontology',
  comment: 'Describes test data',
  lastModificationDate: '2024-03-15T10:30:00Z',
} as unknown as OntologyMetadata;

const meta: Meta<OntologyEditorHeaderComponent> = {
  title: 'Ontology / Header / Ontology Editor Header',
  component: OntologyEditorHeaderComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<OntologyEditorHeaderComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...TranslateModule.forRoot().providers!,
  ...STORY_PROVIDERS,
  {
    provide: OntologyEditService,
    useValue: makeOntologyEditServiceStub({
      currentOntologyInfo$: of(sampleOntologyMeta),
      currentOntologyCanBeDeleted$: of(true),
    }),
  },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
];

export const AdminView: Story = {
  name: 'Shows edit and delete buttons for admin user with loaded ontology',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Ontology label is visible', async () => {
      await expect(canvas.getByTestId('ontology-label')).toBeInTheDocument();
    });
    await step('Edit button is visible', async () => {
      await expect(canvas.getByTestId('edit-ontology-button')).toBeInTheDocument();
    });
  },
};

export const NonAdminView: Story = {
  name: 'Hides edit and delete buttons for non-admin user',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: ProjectPageService,
          useValue: makeProjectPageServiceStub({ hasProjectAdminRights$: of(false) }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Ontology label is visible', async () => {
      await expect(canvas.getByTestId('ontology-label')).toBeInTheDocument();
    });
    await step('Edit button is not present', async () => {
      await expect(canvas.queryByTestId('edit-ontology-button')).toBeNull();
    });
  },
};

export const NoOntologyLoaded: Story = {
  name: 'Renders nothing when no ontology is loaded',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: OntologyEditService,
          useValue: makeOntologyEditServiceStub({
            currentOntologyInfo$: of(null),
            currentOntologyCanBeDeleted$: of(false),
          }),
        },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('No ontology label is visible', async () => {
      await expect(canvas.queryByTestId('ontology-label')).toBeNull();
    });
  },
};
