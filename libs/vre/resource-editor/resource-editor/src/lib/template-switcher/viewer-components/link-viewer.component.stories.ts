import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { LinkViewerComponent } from './link-viewer.component';

const resourceServiceStub: Partial<ResourceService> = {
  getResourcePath: (iri: string) => iri.replace('http://rdfh.ch', ''),
};

const meta: Meta<LinkViewerComponent> = {
  title:
    'Devs / Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Link Viewer',
  component: LinkViewerComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: ResourceService, useValue: resourceServiceStub }],
    }),
  ],
  argTypes: {
    value: {
      description: 'ReadLinkValue containing the linked resource IRI and display string.',
      table: { type: { summary: 'ReadLinkValue' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<LinkViewerComponent>;

export const DefaultView: Story = {
  name: 'Shows a link to the linked resource',
  args: {
    value: {
      strval: 'My Linked Resource',
      linkedResourceIri: 'http://rdfh.ch/0001/abc123',
    } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Link is rendered', async () => {
      const link = canvasElement.querySelector('[data-cy="link-switch"]');
      await expect(link).not.toBeNull();
    });
    await step('Link text matches the resource label', async () => {
      const link = canvasElement.querySelector('[data-cy="link-switch"]');
      await expect(link?.textContent?.trim()).toBe('My Linked Resource');
    });
  },
};
