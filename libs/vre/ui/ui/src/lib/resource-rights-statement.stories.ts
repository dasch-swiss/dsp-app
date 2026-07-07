import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';

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
    defaultResourceAuthorship: { description: 'Project default authorship.', control: 'object' },
    resourceAuthorship: {
      description:
        'Per-resource authorship. When bound (even to []), the component is in per-resource mode: the resource value is shown when non-empty, otherwise the labeled fallback ("no authorship recorded — project default: …") is shown. When left unbound (null), the project-level defaults are shown plainly.',
      control: 'object',
    },
    isAdmin: {
      description: 'Whether the user is a project/system admin (controls the unconfigured callout).',
      control: 'boolean',
    },
    canEditAuthorship: {
      description: 'Whether the user may edit per-resource authorship (Modify rights).',
      control: 'boolean',
    },
    labelAlign: {
      description:
        'Label alignment: "end" (right — matches property rows in the viewer) or "start" (left — for the project card).',
      control: { type: 'radio' },
      options: ['start', 'end'],
    },
    editLegalInfo: { description: 'Emitted when an admin clicks "Edit legal info" on the unconfigured callout.' },
    saveAuthorship: { description: 'Emitted with the new authorship list when a Modify user saves the inline editor.' },
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
    defaultResourceAuthorship: ['Lotte Reiniger', 'Hilma af Klint'],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('License renders as a link to the deed', async () => {
      // The link's accessible name is composed from the label + "opens in a new tab" (WCAG 3.2.5),
      // so match on a regex that anchors on the license label.
      const link = canvas.getByRole('link', { name: /CC BY 4\.0/ });
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
    defaultResourceAuthorship: ['Project Default Author'],
    resourceAuthorship: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The labeled fallback is rendered', async () => {
      // Guards against the pre-refactor regression where this branch was dead code
      // and the project defaults leaked in as if they were the resource's own value.
      const fallback = canvas.getByText(
        /No authorship recorded for this resource\. Project default: Project Default Author/
      );
      await expect(fallback).toBeInTheDocument();
    });
    await step('The fallback is rendered in italic (labeled, not asserted as the resource value)', async () => {
      const fallback = canvas.getByText(/No authorship recorded for this resource/);
      await expect(fallback.tagName.toLowerCase()).toBe('em');
    });
    await step('The project defaults do not leak in as if they were the resource value', async () => {
      // Pre-refactor regression: when perResource was falsy (attribute-form binding bug),
      // the else arm rendered `authorship.join(', ')` plainly. Assert the value cell contains
      // the italic fallback, not the raw defaults as a bare text node.
      const valueCell = canvasElement.querySelector('.row:last-of-type .value');
      await expect(valueCell).not.toBeNull();
      await expect(valueCell!.querySelector('em')).not.toBeNull();
    });
  },
};

export const ShowsAlwaysVisibleEditAffordanceForModifyUsers: Story = {
  name: 'Shows an always-visible authorship edit affordance for Modify users',
  args: {
    licenseLabel: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    copyrightHolder: 'University of Basel',
    defaultResourceAuthorship: ['Lotte Reiniger'],
    resourceAuthorship: ['Lotte Reiniger'],
    canEditAuthorship: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('The authorship edit affordance is present without any hover', async () => {
      // The button is in the DOM immediately (no mouseenter); guards against reverting to a hover-only pill.
      await expect(canvas.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  },
};

export const EditsAuthorshipInlineWithoutADialog: Story = {
  name: 'Edits authorship inline, in place, without opening a dialog',
  args: {
    licenseLabel: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    copyrightHolder: 'University of Basel',
    defaultResourceAuthorship: ['Lotte Reiniger'],
    resourceAuthorship: ['Lotte Reiniger'],
    canEditAuthorship: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Clicking edit opens the chip editor in place (no dialog)', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /edit/i }));
      // The editor renders inline inside the component, not in a CDK overlay/dialog.
      await expect(canvasElement.querySelector('mat-chip-grid')).not.toBeNull();
      await expect(document.querySelector('mat-dialog-container')).toBeNull();
    });
  },
};

export const ShowsAdminsOnlyCalloutWhenUnconfigured: Story = {
  name: 'Shows the admins-only "uncategorized" callout when unconfigured',
  args: { isAdmin: true },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('An "Edit legal info" action is offered to admins', async () => {
      await expect(canvas.getByRole('button', { name: /edit legal info/i })).toBeInTheDocument();
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
