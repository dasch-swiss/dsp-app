import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';
import { AudioMoreButtonComponent } from './audio-more-button.component';

const makeParentResource = () => ({
  id: 'http://rdfh.ch/resource/1',
  type: 'http://example.org/Thing',
  attachedToProject: 'http://rdfh.ch/projects/test',
  properties: {
    'http://api.knora.org/ontology/knora-api/v2#hasAudioFileValue': [
      { fileUrl: 'https://example.org/audio.mp3', userHasPermission: 'RV' },
    ],
  },
  getValues: () => [{ fileUrl: 'https://example.org/audio.mp3', userHasPermission: 'RV' }],
});

const meta: Meta<AudioMoreButtonComponent> = {
  title: 'Devs / Resource Editor / 3. Representation / Audio / Audio More Button',
  component: AudioMoreButtonComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: ResourceFetcherService, useValue: { userCanEdit$: of(false) } },
        { provide: RepresentationService, useValue: { downloadProjectFile: () => {} } },
      ],
    }),
  ],
  argTypes: {
    parentResource: {
      description: 'Parent resource containing the audio file value.',
      table: { type: { summary: 'ParentResourceInput' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<AudioMoreButtonComponent>;

export const DefaultView: Story = {
  name: 'Shows more_vert icon button for audio actions menu',
  args: {
    parentResource: makeParentResource() as any,
  },
  play: async ({ canvasElement, step }) => {
    await step('More button icon is rendered', async () => {
      const icon = canvasElement.querySelector('mat-icon');
      await expect(icon?.textContent?.trim()).toBe('more_vert');
    });
  },
};
