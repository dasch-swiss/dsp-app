import { MatDialog } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { EraseButtonComponent } from './erase-button.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    type: 'http://example.org/Thing',
    label: 'Test Resource',
    lastModificationDate: '2024-06-15T10:00:00.000Z',
  }) as any;

const meta: Meta<EraseButtonComponent> = {
  title: 'Devs / Resource Editor / Header / More Menu / Erase Button',
  component: EraseButtonComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: MatDialog, useValue: { open: () => ({ afterClosed: () => ({ subscribe: () => {} }) }) } }],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The resource to permanently erase.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
    resourceCanBeDeleted$: {
      description: 'Observable emitting whether the resource can be erased.',
      table: { type: { summary: 'Observable<CanDoResponse>' }, category: 'State' },
    },
    erased: {
      description: 'Emitted after the resource is successfully erased.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
};
export default meta;
type Story = StoryObj<EraseButtonComponent>;

export const CanErase: Story = {
  name: 'Shows enabled erase button when resource can be erased',
  args: {
    resource: makeResource(),
    resourceCanBeDeleted$: of({ canDo: true }) as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Erase button is rendered and enabled', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-more-menu-erase-button"]');
      await expect(button).not.toBeNull();
      await expect((button as HTMLButtonElement).disabled).toBe(false);
    });
  },
};

export const CannotErase: Story = {
  name: 'Shows disabled erase button when resource has incoming links',
  args: {
    resource: makeResource(),
    resourceCanBeDeleted$: of({ canDo: false }) as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Erase button is rendered but disabled', async () => {
      const button = canvasElement.querySelector('[data-cy="resource-more-menu-erase-button"]');
      await expect(button).not.toBeNull();
      await expect((button as HTMLButtonElement).disabled).toBe(true);
    });
  },
};
