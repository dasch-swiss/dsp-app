import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from './representations/resource-fetcher.service';
import { ResourceLegalComponent } from './resource-legal.component';

const makeLicenses = () => [
  {
    id: 'http://example.org/custom-license',
    labelEn: 'Custom License',
    uri: 'https://example.org/license',
    labelDe: 'Eigene Lizenz',
  },
];

const makeFileValue = (overrides: Record<string, unknown> = {}) =>
  ({
    copyrightHolder: 'DaSCH',
    authorship: ['Jane Doe', 'John Smith'],
    license: { id: 'http://example.org/custom-license' },
    ...overrides,
  }) as any;

const meta: Meta<ResourceLegalComponent> = {
  title: 'Devs / Resource Editor / Resource Header / Resource Legal',
  component: ResourceLegalComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ResourceFetcherService,
          useValue: { projectShortcode$: of('test') },
        },
        {
          provide: AdminAPIApiService,
          useValue: {
            getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ data: makeLicenses() }),
          },
        },
      ],
    }),
  ],
  argTypes: {
    fileValue: {
      description: 'File value containing copyright, authorship and license information.',
      table: { type: { summary: 'ReadFileValue' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<ResourceLegalComponent>;

export const WithCopyrightAndAuthorship: Story = {
  name: 'Shows copyright holder, authorship and license',
  args: { fileValue: makeFileValue() },
  play: async ({ canvasElement, step }) => {
    await step('Copyright holder is displayed', async () => {
      await expect(canvasElement.textContent).toContain('DaSCH');
    });
    await step('Author names are displayed', async () => {
      await expect(canvasElement.textContent).toContain('Jane Doe');
    });
  },
};

export const WithoutLegalInfo: Story = {
  name: 'Renders nothing when no copyright or authorship is set',
  args: {
    fileValue: makeFileValue({ copyrightHolder: null, authorship: [], license: null }),
  },
  play: async ({ canvasElement, step }) => {
    await step('No legal block is rendered', async () => {
      await expect(canvasElement.textContent?.trim()).toBe('');
    });
  },
};
