import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect } from 'storybook/test';

import { ResourceFetcherDialogComponent } from './resource-fetcher-dialog.component';

@Component({
  selector: 'app-resource-fetcher-dialog-launcher',
  template: ``,
})
class ResourceFetcherDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);

  ngOnInit() {
    this._dialog.open(ResourceFetcherDialogComponent, { data: { resourceIri: 'http://rdfh.ch/resource/1', index: 0 } });
  }
}

const meta: Meta<ResourceFetcherDialogLauncherComponent> = {
  title: 'Visual / Resource Editor / Resource / Resource Fetcher Dialog',
  component: ResourceFetcherDialogLauncherComponent,
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
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
type Story = StoryObj<ResourceFetcherDialogLauncherComponent>;

export const DefaultView: Story = {
  name: 'Shows resource fetcher wrapped in closing dialog',
  play: async ({ step }) => {
    await step('Resource dialog container is rendered', async () => {
      const container = document.querySelector('[data-cy="resource-dialog"]');
      await expect(container).not.toBeNull();
    });
  },
};
