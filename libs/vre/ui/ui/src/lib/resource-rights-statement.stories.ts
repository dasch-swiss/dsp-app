import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';

import { ResourceRightsStatementComponent } from './resource-rights-statement.component';

const meta: Meta<ResourceRightsStatementComponent> = {
  title: 'UI / Resource Rights Statement',
  component: ResourceRightsStatementComponent,
  argTypes: {
    licenseLabel: {
      description: 'Human-readable license label (e.g. "CC BY 4.0"). Its presence marks the project as configured.',
      control: 'text',
    },
    licenseUrl: { description: 'Creative Commons deed URL; the label is rendered as a link to it.', control: 'text' },
    copyrightHolder: { description: 'Project-wide copyright holder.', control: 'text' },
    authorship: { description: 'Project default authorship.', control: 'object' },
    resourceAuthorship: {
      description: 'Per-resource authorship; empty/absent shows the labeled fallback in a per-resource context.',
      control: 'object',
    },
    perResource: { description: 'Per-resource display (viewer/create) vs. project-level display.', control: 'boolean' },
    isAdmin: { description: 'Whether the user is a project/system admin (controls the unconfigured callout).', control: 'boolean' },
    canEditAuthorship: { description: 'Whether the user may edit per-resource authorship (Modify rights).', control: 'boolean' },
    editLegalInfo: { description: 'Emitted when an admin clicks "Edit legal info" on the unconfigured callout.' },
    editAuthorship: { description: 'Emitted when a Modify user clicks the inline authorship edit affordance.' },
  },
};
export default meta;
type Story = StoryObj<ResourceRightsStatementComponent>;

export const ShowsLicenseHolderAndAuthorshipWhenConfigured: Story = {
  name: 'Shows license, holder and authorship when configured',
  args: {
    licenseLabel: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    copyrightHolder: 'University of Basel',
    authorship: ['Lotte Reiniger', 'Hilma af Klint'],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('License renders as a link to the deed', async () => {
      const link = canvas.getByRole('link', { name: 'CC BY 4.0' });
      await expect(link).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    });
    await step('Copyright holder is visible', async () => {
      await expect(canvas.getByText('University of Basel')).toBeInTheDocument();
    });
    await step('Authorship is listed', async () => {
      await expect(canvas.getByText('Lotte Reiniger, Hilma af Klint')).toBeInTheDocument();
    });
  },
};

export const ShowsFallbackWhenResourceHasNoOwnAuthorship: Story = {
  name: 'Shows the labeled fallback when a resource has no own authorship',
  args: {
    licenseLabel: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    copyrightHolder: 'University of Basel',
    authorship: ['Project Default Author'],
    resourceAuthorship: [],
    perResource: true,
  },
};

export const ShowsAdminsOnlyCalloutWhenUnconfigured: Story = {
  name: 'Shows the admins-only "uncategorized" callout when unconfigured',
  args: { isAdmin: true },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('An "Edit legal info" action is offered to admins', async () => {
      await expect(canvas.getByRole('button')).toBeInTheDocument();
    });
  },
};

export const RendersNothingForNonAdminsWhenUnconfigured: Story = {
  name: 'Renders nothing for non-admins when unconfigured',
  args: { isAdmin: false },
  play: async ({ canvasElement, step }) => {
    await step('No rights block is rendered', async () => {
      await expect(canvasElement.querySelector('.rights-statement')).toBeNull();
    });
  },
};
