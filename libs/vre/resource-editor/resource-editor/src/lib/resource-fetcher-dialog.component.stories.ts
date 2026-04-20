import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherDialogComponent } from './resource-fetcher-dialog.component';

const meta: Meta<ResourceFetcherDialogComponent> = {
  title: 'Devs / Resource Editor / Resource / Resource Fetcher Dialog',
  component: ResourceFetcherDialogComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: MAT_DIALOG_DATA, useValue: { resourceIri: 'http://rdfh.ch/resource/1', index: 0 } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              res: { getResource: () => NEVER },
              search: { doSearchIncomingLinks: () => NEVER, doExtendedSearch: () => NEVER },
            },
          },
        },
        {
          provide: AdminAPIApiService,
          useValue: {
            getAdminProjectsIriProjectiri: () => of({ project: {} }),
            getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ licenses: [] }),
          },
        },
        { provide: UserApiService, useValue: { get: () => of({ user: {} }) } },
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<ResourceFetcherDialogComponent>;

export const DefaultView: Story = {
  name: 'Shows resource fetcher wrapped in closing dialog',
  play: async ({ canvasElement, step }) => {
    await step('Resource dialog container is rendered', async () => {
      const container = canvasElement.querySelector('[data-cy="resource-dialog"]');
      await expect(container).not.toBeNull();
    });
  },
};
