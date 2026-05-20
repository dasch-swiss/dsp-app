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
import { OntologyPageService } from '../../ontology-page.service';
import { OntologyEditService } from '../../services/ontology-edit.service';
import {
  makeOntologyEditServiceStub,
  makeOntologyPageServiceStub,
  makeProjectPageServiceStub,
  makeResourceClassInfo,
  STORY_PROVIDERS,
} from '../../stories.helpers';
import { ResourceClassInfoComponent } from './resource-class-info.component';

const resourceClass = makeResourceClassInfo();

const meta: Meta<ResourceClassInfoComponent> = {
  title: 'Ontology Editor / 3a. Resource Classes Tab / Resource Class Info',
  component: ResourceClassInfoComponent,
  argTypes: {
    resourceClass: {
      description: 'The resource class model to display including its properties.',
      table: { type: { summary: 'ResourceClassInfo' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceClassInfoComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: DspApiConnectionToken, useValue: { v2: { onto: { canDeleteResourceClass: () => of({ canDo: true }) } } } },
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
  { provide: OntologyPageService, useValue: makeOntologyPageServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  { provide: Clipboard, useValue: { copy: () => {} } },
  { provide: DialogService, useValue: { afterConfirmation: () => of(true) } },
];

export const EmptyClass: Story = {
  name: 'Renders resource class card with no properties',
  decorators: [applicationConfig({ providers: sharedProviders })],
  args: { resourceClass },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Class card is rendered', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const AdminView: Story = {
  name: 'Shows edit controls for admin users',
  decorators: [applicationConfig({ providers: sharedProviders })],
  args: { resourceClass },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Edit menu button is visible', async () => {
      await expect(canvas.getByTestId('class-menu-button')).toBeInTheDocument();
    });
  },
};

export const ReadOnlyView: Story = {
  name: 'Hides edit controls for non-admin users',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ hasProjectAdminRights$: of(false) }) },
      ],
    }),
  ],
  args: { resourceClass },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Edit menu button is not present', async () => {
      await expect(canvas.queryByTestId('class-menu-button')).toBeNull();
    });
  },
};
