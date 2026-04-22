import { FormControl, FormGroup } from '@angular/forms';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { PaginatedApiService } from '@dasch-swiss/vre/shared/app-common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect } from 'storybook/test';

import { CreateResourceFormLegalComponent } from './create-resource-form-legal.component';

const makeFormGroup = () =>
  new FormGroup({
    copyrightHolder: new FormControl<string | null>(null),
    license: new FormControl<any | null>(null),
    authorship: new FormControl<string[] | null>([]),
  });

const meta: Meta<CreateResourceFormLegalComponent> = {
  title: 'Devs / Resource Editor / Resource Creator / Create Resource Form Legal',
  component: CreateResourceFormLegalComponent,
  decorators: [
    applicationConfig({
      providers: [
        { provide: PaginatedApiService, useValue: { get: () => of([]) } },
        {
          provide: AdminAPIApiService,
          useValue: {
            getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ data: [] }),
            getAdminProjectsShortcodeProjectshortcodeLegalInfoCopyrightHolders: () => of({ data: [] }),
          },
        },
      ],
    }),
  ],
  argTypes: {
    formGroup: {
      description: 'Form group containing copyright holder, license and authorship controls.',
      table: { type: { summary: 'CreateResourceFormLegal' }, category: 'State' },
    },
    projectShortcode: {
      description: 'Project shortcode used to fetch available copyright holders and licenses.',
      table: { type: { summary: 'string' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<CreateResourceFormLegalComponent>;

export const DefaultView: Story = {
  name: 'Shows copyright holder and license fields',
  args: {
    formGroup: makeFormGroup() as any,
    projectShortcode: 'test',
  },
  play: async ({ canvasElement, step }) => {
    await step('Copyright holder select is rendered', async () => {
      const field = canvasElement.querySelector('[data-cy="copyright-holder-select"]');
      await expect(field).not.toBeNull();
    });
    await step('License select is rendered', async () => {
      const field = canvasElement.querySelector('[data-cy="license-select"]');
      await expect(field).not.toBeNull();
    });
  },
};
