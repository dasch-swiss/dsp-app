import { MatDialog } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { DeleteButtonComponent } from './delete-button.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
  }) as any;

const meta: Meta<DeleteButtonComponent> = {
  title: 'Devs / Resource Editor Resource Header / More Menu / Delete Button',
  component: DeleteButtonComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: MatDialog, useValue: { open: () => ({ afterClosed: () => ({ subscribe: () => {} }) }) } }],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The resource to delete.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
    resourceCanBeDeleted$: {
      description: 'Observable emitting whether the resource can be deleted.',
      table: { type: { summary: 'Observable<CanDoResponse>' }, category: 'State' },
    },
    deleted: {
      description: 'Emitted after the resource is successfully deleted.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<DeleteButtonComponent>;

export const CanDelete: Story = {
  name: 'Shows enabled delete button when resource can be deleted',
  args: {
    resource: makeResource(),
    resourceCanBeDeleted$: of({ canDo: true }) as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Delete button is rendered and enabled', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-more-menu-delete-button"]');
      await expect(button).not.toBeNull();
      await expect((button as HTMLButtonElement).disabled).toBe(false);
    });
  },
};

export const CannotDelete: Story = {
  name: 'Shows disabled delete button when resource has incoming links',
  args: {
    resource: makeResource(),
    resourceCanBeDeleted$: of({ canDo: false }) as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Delete button is rendered but disabled', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-more-menu-delete-button"]');
      await expect(button).not.toBeNull();
      await expect((button as HTMLButtonElement).disabled).toBe(true);
    });
  },
};
