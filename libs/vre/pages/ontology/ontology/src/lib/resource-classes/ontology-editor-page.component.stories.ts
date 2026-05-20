import { Clipboard } from '@angular/cdk/clipboard';
import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { DialogService } from '@dasch-swiss/vre/ui/ui';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { OntologyPageService } from '../ontology-page.service';
import { OntologyEditService } from '../services/ontology-edit.service';
import {
  makeOntologyEditServiceStub,
  makeOntologyPageServiceStub,
  makeProjectPageServiceStub,
  makeResourceClassInfo,
  STORY_PROVIDERS,
} from '../stories.helpers';
import { OntologyEditorPageComponent } from './ontology-editor-page.component';

const resourceClass = makeResourceClassInfo();

const meta: Meta<OntologyEditorPageComponent> = {
  title: 'Ontology / Resource Classes / Ontology Editor Page',
  component: OntologyEditorPageComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<OntologyEditorPageComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: DspApiConnectionToken, useValue: { v2: { onto: { canDeleteResourceClass: () => of({ canDo: true }) } } } },
  {
    provide: OntologyEditService,
    useValue: makeOntologyEditServiceStub({ currentOntologyClasses$: of([resourceClass]) }),
  },
  { provide: OntologyPageService, useValue: makeOntologyPageServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  { provide: Clipboard, useValue: { copy: () => {} } },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
];

export const WithOneClass: Story = {
  name: 'Renders grid with one resource class card',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Grid container is rendered', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const EmptyOntology: Story = {
  name: 'Renders empty grid when ontology has no classes',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        { provide: OntologyEditService, useValue: makeOntologyEditServiceStub({ currentOntologyClasses$: of([]) }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Component renders without error', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
