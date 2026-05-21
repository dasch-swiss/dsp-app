import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { OntologyEditService } from '../../services/ontology-edit.service';
import { makeOntologyEditServiceStub, makeResourceClassInfo, STORY_PROVIDERS } from '../../stories.helpers';
import { AddPropertyMenuComponent } from './add-property-menu.component';

const resourceClass = makeResourceClassInfo();

const meta: Meta<AddPropertyMenuComponent> = {
  title: 'Ontology Editor / 3a. Resource Classes Tab / Resource Class Info / Add Property Menu',
  component: AddPropertyMenuComponent,
  argTypes: {
    resourceClass: {
      description: 'The resource class to which properties can be added.',
      table: { type: { summary: 'ResourceClassInfo' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<AddPropertyMenuComponent>;

const sharedProviders = [
  provideAnimations(),
  importProvidersFrom(OverlayModule),
  ...STORY_PROVIDERS,
  { provide: OntologyEditService, useValue: makeOntologyEditServiceStub() },
];

export const DefaultView: Story = {
  name: 'Shows add property list item',
  decorators: [applicationConfig({ providers: sharedProviders })],
  args: { resourceClass },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Add property button is rendered', async () => {
      await expect(canvas.getByTestId('add-property-button')).toBeInTheDocument();
    });
  },
};
