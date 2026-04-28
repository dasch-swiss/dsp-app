import { importProvidersFrom } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { IncomingStandoffLinkValueComponent } from './incoming-standoff-link-value.component';

const makeLinks = () => [
  { iri: 'http://rdfh.ch/resource/1', label: 'Resource A', project: 'TestProject', uri: '/project/test/resource/1' },
  { iri: 'http://rdfh.ch/resource/2', label: 'Resource B', project: 'TestProject', uri: '/project/test/resource/2' },
];

const meta: Meta<IncomingStandoffLinkValueComponent> = {
  title:
    'Devs / Resource Editor / 4. Properties / Resource Default Tabs / Properties Display /Incoming, standoff / Incoming Standoff Link Value',
  component: IncomingStandoffLinkValueComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        { provide: MatDialog, useValue: { open: () => {}, openDialogs: [] } },
      ],
    }),
  ],
  argTypes: {
    links: {
      description: 'List of incoming or standoff links to display.',
      table: { type: { summary: 'IncomingOrStandoffLink[]' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<IncomingStandoffLinkValueComponent>;

export const WithLinks: Story = {
  name: 'Shows list of linked resource labels with navigation buttons',
  args: { links: makeLinks() },
  play: async ({ canvasElement, step }) => {
    await step('First link label is displayed', async () => {
      await expect(canvasElement.textContent).toContain('Resource A');
    });
    await step('Second link label is displayed', async () => {
      await expect(canvasElement.textContent).toContain('Resource B');
    });
  },
};
