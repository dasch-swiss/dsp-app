import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherService } from '../representations/resource-fetcher.service';
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
