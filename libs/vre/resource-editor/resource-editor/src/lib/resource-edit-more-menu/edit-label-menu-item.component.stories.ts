import { MatDialog } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { EditLabelMenuItemComponent } from './edit-label-menu-item.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
  }) as any;

const meta: Meta<EditLabelMenuItemComponent> = {
  title: 'Devs / Resource Editor / Header / More Menu / Edit Label Menu Item',
  component: EditLabelMenuItemComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: MatDialog, useValue: { open: () => ({ afterClosed: () => ({ subscribe: () => {} }) }) } }],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The resource whose label will be edited.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
    resourceUpdated: {
      description: 'Emitted after the label is successfully updated.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<EditLabelMenuItemComponent>;

export const DefaultView: Story = {
  name: 'Shows edit label menu item button',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Edit label button is rendered', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-more-menu-edit-label-button"]');
      await expect(button).not.toBeNull();
    });
    await step('Edit icon is shown', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('edit');
    });
  },
};
