import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { ResourceFetcherDialogComponent } from './resource-fetcher-dialog.component';

const meta: Meta<ResourceFetcherDialogComponent> = {
  title: 'Devs / Resource Editor / Resource / Resource Fetcher Dialog',
  component: ResourceFetcherDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { resourceIri: 'http://rdfh.ch/resource/1', index: 0 } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<ResourceFetcherDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows resource fetcher wrapped in closing dialog',
  play: async ({ canvasElement, step }) => {
    await step('Resource dialog container is rendered', async () => {
      const container = canvasElement.querySelector('[data-cy="resource-dialog"]');
      await expect(container).not.toBeNull();
    });
  },
};
