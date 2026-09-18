import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representation/resource-fetcher.service';
import { ResourceInfoBarComponent } from './resource-info-bar.component';

const makeResource = () =>
  ({
    id: 'http://rdfh.ch/resource/1',
    label: 'Test Resource',
    attachedToProject: 'http://rdfh.ch/projects/test',
    attachedToUser: 'http://rdfh.ch/users/test-user',
    creationDate: '2024-06-15T10:00:00.000Z',
  }) as any;

const makeProjectApiStub = () => ({
  get: () =>
    of({
      project: {
        id: 'http://rdfh.ch/projects/test',
        shortname: 'test',
        longname: 'Test Project',
      },
    }),
});

const meta: Meta<ResourceInfoBarComponent> = {
  title: 'Resource Editor / 2. Header / Resource Info Bar',
  component: ResourceInfoBarComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(RouterModule.forRoot([])),
        {
          provide: ResourceFetcherService,
          useValue: {
            attachedUser$: of({ givenName: 'Jane', familyName: 'Doe', username: 'jane.doe' }),
          },
        },
        { provide: ProjectApiService, useValue: makeProjectApiStub() },
      ],
    }),
  ],
  argTypes: {
    resource: {
      description: 'The resource whose project and creator information is displayed.',
      table: { type: { summary: 'ReadResource' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceInfoBarComponent>;

export const DefaultView: Story = {
  name: 'Shows project shortname and creator info',
  args: { resource: makeResource() },
  play: async ({ canvasElement, step }) => {
    await step('Project shortname is displayed', async () => {
      await expect(canvasElement.textContent).toContain('test');
    });
    await step('Creator name is displayed', async () => {
      await expect(canvasElement.textContent).toContain('Jane');
    });
  },
};

/**
 * The info bar is right-aligned by its callers (annotation tab, segment tab, incoming
 * resource header) with `flex-direction: row-reverse`. DEV-6682: in that layout the
 * metadata line used to sit flush against the card's right border. The component keeps
 * its own right padding so the text never touches the edge.
 */
const MIN_RIGHT_PADDING_PX = 16;

const rightGapOf = (canvasElement: HTMLElement) => {
  const host = canvasElement.querySelector('app-resource-info-bar') as HTMLElement;
  const infobar = host.querySelector('.infobar') as HTMLElement;
  const range = document.createRange();
  range.selectNodeContents(infobar);
  return host.getBoundingClientRect().right - range.getBoundingClientRect().right;
};

const rightAlignedCard = (width: string) => ({
  template: `
    <div style="width: ${width}; border: 1px solid #ccc; padding: 0 24px 16px; overflow: hidden">
      <app-resource-info-bar [resource]="resource" style="display: flex; flex-direction: row-reverse" />
    </div>`,
});

export const KeepsRightPaddingFromCardEdge: Story = {
  name: 'Keeps right padding when right-aligned in a card',
  args: { resource: makeResource() },
  render: args => ({ props: args, ...rightAlignedCard('420px') }),
  play: async ({ canvasElement, step }) => {
    await step('Metadata text is rendered', async () => {
      await expect(canvasElement.textContent).toContain('test');
    });
    await step('Metadata text does not touch the right edge', async () => {
      await expect(rightGapOf(canvasElement)).toBeGreaterThanOrEqual(MIN_RIGHT_PADDING_PX);
    });
  },
};

export const KeepsRightPaddingWhenLineOverflowsNarrowPanel: Story = {
  name: 'Keeps right padding when the line is too long for the panel',
  args: { resource: makeResource() },
  render: args => ({ props: args, ...rightAlignedCard('240px') }),
  play: async ({ canvasElement, step }) => {
    await step('Metadata text does not touch the right edge', async () => {
      await expect(rightGapOf(canvasElement)).toBeGreaterThanOrEqual(MIN_RIGHT_PADDING_PX);
    });
  },
};
