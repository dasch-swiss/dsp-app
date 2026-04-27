import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { SingleResourcePageComponent } from './single-resource-page.component';

const meta: Meta<SingleResourcePageComponent> = {
  title: 'Visual / Resource Editor / Resource / Single Resource Page',
  component: SingleResourcePageComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        {
          provide: ResourceService,
          useValue: {
            getResourceIri: (shortcode: string, uuid: string) => `http://rdfh.ch/${shortcode}/${uuid}`,
          },
        },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<SingleResourcePageComponent>;

export const DefaultView: Story = {
  name: 'Shows centered layout container for resource display',
  play: async ({ canvasElement, step }) => {
    await step('Centered layout is rendered', async () => {
      const layout = canvasElement.querySelector('app-centered-layout');
      await expect(layout).not.toBeNull();
    });
  },
};
