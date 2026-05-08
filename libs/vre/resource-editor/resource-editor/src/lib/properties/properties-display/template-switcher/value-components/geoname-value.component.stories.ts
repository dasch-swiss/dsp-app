import { FormControl } from '@angular/forms';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { GeonameService } from '../geoname.service';
import { GeonameValueComponent } from './geoname-value.component';

const geonameServiceStub: Partial<GeonameService> = {
  resolveGeonameID: () =>
    of({
      displayName: 'Bern, Switzerland',
      name: 'Bern',
      country: 'Switzerland',
      location: { lat: 46.948, lng: 7.4474 },
    } as any),
  searchPlace: () => of([]),
};

const meta: Meta<GeonameValueComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Geoname Value',
  component: GeonameValueComponent,
  decorators: [
    applicationConfig({
      providers: [{ provide: GeonameService, useValue: geonameServiceStub }],
    }),
  ],
  argTypes: {
    control: {
      description: 'FormControl bound to the geoname ID string.',
      table: { type: { summary: 'FormControl<string>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<GeonameValueComponent>;

export const Empty: Story = {
  name: 'Shows empty autocomplete input for geoname search',
  args: {
    control: new FormControl<string>('', { nonNullable: true }),
  },
  play: async ({ canvasElement, step }) => {
    await step('Geoname autocomplete input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="geoname-autocomplete"]');
      await expect(input).not.toBeNull();
    });
  },
};

export const WithPrefilledValue: Story = {
  name: 'Shows resolved place name for a pre-existing geoname ID',
  args: {
    control: new FormControl<string>('2661552', { nonNullable: true }),
  },
  play: async ({ canvasElement, step }) => {
    await step('Geoname autocomplete input is rendered', async () => {
      const input = canvasElement.querySelector('[data-cy="geoname-autocomplete"]');
      await expect(input).not.toBeNull();
    });
  },
};
