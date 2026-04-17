import { MatDialog } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ResourceExplorerButtonComponent } from './resource-explorer-button.component';

const meta: Meta<ResourceExplorerButtonComponent> = {
  title: 'Devs / Resource Editor / Resource Header / Resource Explorer Button',
  component: ResourceExplorerButtonComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: MatDialog, useValue: { open: () => {}, openDialogs: [] } }],
    }),
  ],
  argTypes: {
    resourceIri: {
      description: 'IRI of the resource to open in the explorer dialog.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceExplorerButtonComponent>;

export const DefaultView: Story = {
  name: 'Shows arrow icon button to open resource explorer',
  args: {
    resourceIri: 'http://rdfh.ch/resource/1',
  },
  play: async ({ canvasElement, step }) => {
    await step('Explorer button icon is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('arrow_circle_right');
    });
  },
};
