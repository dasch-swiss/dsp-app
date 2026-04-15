import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';

import { PermissionInfoComponent } from './permission-info.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeResource = (hasPermissions: string, userHasPermission: string): ReadResource => {
  const res = new ReadResource();
  res.id = 'http://rdfh.ch/resource/1';
  res.type = 'http://api.dasch.swiss/ontology/0001/anything/v2#Thing';
  res.attachedToProject = 'http://rdfh.ch/projects/0001';
  res.attachedToUser = 'http://rdfh.ch/users/root';
  res.hasPermissions = hasPermissions;
  res.userHasPermission = userHasPermission;
  res.properties = {};
  return res;
};

// ProjectAdmin=CR (all), ProjectMember/KnownUser/UnknownUser=V (RV+V), user=CR
// Matches: ProjectAdmin all ✓, Member/KnownUser/UnknownUser RV+V ✓ rest ✗, user all ✓
const fullPermissionsResource = makeResource(
  'CR knora-base:ProjectAdmin|V knora-base:ProjectMember|V knora-base:KnownUser|V knora-base:UnknownUser',
  'CR'
);

// Restricted: only RV for all groups, user has RV
const restrictedResource = makeResource(
  'RV knora-base:ProjectAdmin|RV knora-base:ProjectMember|RV knora-base:KnownUser|RV knora-base:UnknownUser',
  'RV'
);

// Custom group IRI alongside standard groups
const customGroupIri = 'http://rdfh.ch/groups/0001/customEditors';
const customGroupResource = makeResource(
  `CR knora-base:ProjectAdmin|M knora-base:ProjectMember,${customGroupIri}|V knora-base:KnownUser|V knora-base:UnknownUser`,
  'CR'
);

const dspApiConnectionStub = {
  admin: {
    groupsEndpoint: {
      getGroupByIri: () => NEVER,
    },
  },
};

const dspApiConnectionWithCustomGroup = {
  admin: {
    groupsEndpoint: {
      getGroupByIri: (_iri: string) =>
        of({
          status: 200,
          body: { group: { id: customGroupIri, name: 'Custom Editors' } },
        }),
    },
  },
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<PermissionInfoComponent> = {
  title: 'Devs / Resource Editor / Permission Info',
  component: PermissionInfoComponent,
  decorators: [componentWrapperDecorator(story => `<div style="display:flex;justify-content:center">${story}</div>`)],
  argTypes: {
    resource: {
      description: 'The `ReadResource` whose permissions are displayed.',
      table: { type: { summary: 'ReadResource' }, category: 'Inputs' },
    },
  },
};
export default meta;
type Story = StoryObj<PermissionInfoComponent>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const FullPermissions: Story = {
  name: 'Shows full permission matrix for a resource with CR-level access',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
      ],
    }),
  ],
  args: { resource: fullPermissionsResource },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Lock button is rendered', async () => {
      await expect(canvasElement.querySelector('button[mat-icon-button]')).not.toBeNull();
    });
    await step('Clicking the lock button opens the permission overlay', async () => {
      const button = canvas.getByRole('button');
      await userEvent.click(button);
      const overlay = document.querySelector('.overlay-info-box');
      await expect(overlay).not.toBeNull();
    });
  },
};

export const RestrictedPermissions: Story = {
  name: 'Shows restricted permission matrix when only RV is granted to all groups',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: dspApiConnectionStub },
      ],
    }),
  ],
  args: { resource: restrictedResource },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Lock button is rendered', async () => {
      await expect(canvasElement.querySelector('button[mat-icon-button]')).not.toBeNull();
    });
    await step('Clicking the lock button opens the permission overlay', async () => {
      const button = canvas.getByRole('button');
      await userEvent.click(button);
      const overlay = document.querySelector('.overlay-info-box');
      await expect(overlay).not.toBeNull();
    });
  },
};

export const WithCustomGroup: Story = {
  name: 'Shows a custom project group row when the resource grants permissions to a custom group',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(OverlayModule),
        { provide: DspApiConnectionToken, useValue: dspApiConnectionWithCustomGroup },
      ],
    }),
  ],
  args: { resource: customGroupResource },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Lock button is rendered', async () => {
      await expect(canvasElement.querySelector('button[mat-icon-button]')).not.toBeNull();
    });
    await step('Opening the overlay shows the custom group row', async () => {
      const button = canvas.getByRole('button');
      await userEvent.click(button);
      const overlay = document.querySelector('.overlay-info-box');
      await expect(overlay).not.toBeNull();
      await expect(overlay?.textContent).toContain('Custom Editors');
    });
  },
};
