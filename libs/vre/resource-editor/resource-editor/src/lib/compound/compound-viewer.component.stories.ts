import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { CompoundViewerComponent } from './compound-viewer.component';
import { CompoundService } from './compound.service';

const meta: Meta<CompoundViewerComponent> = {
  title: 'Resource Editor / Resource / Compound / Compound Viewer',
  component: CompoundViewerComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: CompoundService,
          useValue: {
            incomingResource$: of(undefined),
          },
        },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<CompoundViewerComponent>;

export const NoIncomingResource: Story = {
  name: 'Shows empty container when no incoming resource is loaded',
  play: async ({ canvasElement, step }) => {
    await step('Representation container is rendered', async () => {
      const container = canvasElement.querySelector('app-resource-representation-container');
      await expect(container).not.toBeNull();
    });
  },
};
