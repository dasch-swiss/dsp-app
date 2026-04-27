import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { GeonameService } from '../geoname.service';
import { GeonameViewerComponent } from './geoname-viewer.component';

const geonameServiceStub: Partial<GeonameService> = {
  resolveGeonameID: () =>
    of({
      displayName: 'Bern, Switzerland',
      name: 'Bern',
      country: 'Switzerland',
      administrativeName: 'Canton of Bern',
      location: { lat: 46.948, lng: 7.4474 },
    } as any),
};

const meta: Meta<GeonameViewerComponent> = {
  title: 'Devs / Resource Editor / 4. Properties / Template Switcher / Geoname Viewer',
  component: GeonameViewerComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: GeonameService, useValue: geonameServiceStub }],
    }),
  ],
  argTypes: {
    value: {
      description: 'ReadGeonameValue containing the geoname ID.',
      table: { type: { summary: 'ReadGeonameValue' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<GeonameViewerComponent>;

export const DefaultView: Story = {
  name: 'Shows a link to the resolved geoname location',
  args: {
    value: { geoname: '2661552' } as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('Geoname link is rendered', async () => {
      const link = canvasElement.querySelector('[data-cy="geoname-switch-link"]');
      await expect(link).not.toBeNull();
    });
    await step('Link href points to geonames.org', async () => {
      const link = canvasElement.querySelector('[data-cy="geoname-switch-link"]') as HTMLAnchorElement;
      await expect(link.href).toContain('geonames.org');
    });
    await step('Resolved place name is displayed', async () => {
      const link = canvasElement.querySelector('[data-cy="geoname-switch-link"]');
      await expect(link?.textContent?.trim()).toContain('Bern');
    });
  },
};
