import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ProjectPageService } from '@dasch-swiss/vre/pages/project/project';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { OntologyPageService } from './ontology-page.service';
import { OntologySidenavComponent } from './ontology-sidenav.component';
import { makeOntologyPageServiceStub, makeProjectPageServiceStub, STORY_PROVIDERS } from './stories.helpers';

const meta: Meta<OntologySidenavComponent> = {
  title: 'Ontology Editor / 2. Sidenav',
  component: OntologySidenavComponent,
  argTypes: {},
};
export default meta;
type Story = StoryObj<OntologySidenavComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: OntologyPageService, useValue: makeOntologyPageServiceStub() },
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
];

export const AdminView: Story = {
  name: 'Renders sidenav with tab navigation for admin user',
  decorators: [applicationConfig({ providers: sharedProviders })],
  play: async ({ canvasElement, step }) => {
    await step('Sidenav component renders', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const NonAdminView: Story = {
  name: 'Hides create buttons for non-admin users',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        { provide: ProjectPageService, useValue: makeProjectPageServiceStub({ hasProjectAdminRights$: of(false) }) },
      ],
    }),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Create class button is not present', async () => {
      await expect(canvas.queryByTestId('create-class-button')).toBeNull();
    });
  },
};
