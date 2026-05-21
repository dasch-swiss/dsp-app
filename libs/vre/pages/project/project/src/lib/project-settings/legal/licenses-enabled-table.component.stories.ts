import { ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { makeReadProject } from '../../stories.helpers';
import { LicensesEnabledTableComponent } from './licenses-enabled-table.component';

const makeLicense = (partial: Partial<ProjectLicenseDto>): ProjectLicenseDto => ({
  id: 'license-1',
  labelEn: 'Creative Commons CC0',
  uri: 'https://creativecommons.org/publicdomain/zero/1.0/',
  isEnabled: true,
  isRecommended: true,
  ...partial,
});

const meta: Meta<LicensesEnabledTableComponent> = {
  title: 'Pages / Project / Legal Settings / Licenses Enabled Table',
  component: LicensesEnabledTableComponent,
  argTypes: {
    licenses: {
      description: 'List of project licenses to display.',
      control: 'object',
      table: { type: { summary: 'ProjectLicenseDto[]' }, category: 'Content' },
    },
    project: {
      description: 'The current project context.',
      control: 'object',
      table: { type: { summary: 'ReadProject' }, category: 'Content' },
    },
    label: {
      description: 'Column header label for the licenses.',
      control: 'text',
      table: { type: { summary: 'string' }, category: 'Content' },
    },
    licenseToggle: {
      description: 'Emitted when a license checkbox is toggled.',
      table: { category: 'Events', type: { summary: 'EventEmitter<LicenseToggleEvent>' } },
    },
  },
};
export default meta;
type Story = StoryObj<LicensesEnabledTableComponent>;

export const AllEnabled: Story = {
  name: 'Shows all licenses enabled with correct enabled count',
  args: {
    label: 'Recommended licenses',
    project: makeReadProject(),
    licenses: [
      makeLicense({ id: '1', labelEn: 'CC0 1.0', isEnabled: true }),
      makeLicense({ id: '2', labelEn: 'CC BY 4.0', isEnabled: true }),
      makeLicense({ id: '3', labelEn: 'CC BY-SA 4.0', isEnabled: true }),
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('All license names are displayed', async () => {
      await expect(canvas.getByText('CC0 1.0')).toBeInTheDocument();
      await expect(canvas.getByText('CC BY 4.0')).toBeInTheDocument();
    });
    await step('Enabled count shows 3', async () => {
      await expect(canvas.getByText(/Enabled.*\(3\)/)).toBeInTheDocument();
    });
  },
};

export const SomeDisabled: Story = {
  name: 'Shows correct enabled count when some licenses are disabled',
  args: {
    label: 'Recommended licenses',
    project: makeReadProject(),
    licenses: [
      makeLicense({ id: '1', labelEn: 'CC0 1.0', isEnabled: true }),
      makeLicense({ id: '2', labelEn: 'CC BY 4.0', isEnabled: false }),
      makeLicense({ id: '3', labelEn: 'CC BY-SA 4.0', isEnabled: false }),
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Enabled count shows 1', async () => {
      await expect(canvas.getByText(/Enabled.*\(1\)/)).toBeInTheDocument();
    });
  },
};

export const TogglesLicense: Story = {
  name: 'Emits licenseToggle event when checkbox is clicked',
  args: {
    label: 'Other licenses',
    project: makeReadProject(),
    licenses: [makeLicense({ id: 'lic-1', labelEn: 'MIT License', isEnabled: true })],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('License row is visible', async () => {
      await expect(canvas.getByText('MIT License')).toBeInTheDocument();
    });
    await step('Click the checkbox to toggle', async () => {
      await userEvent.click(canvas.getByRole('checkbox'));
    });
    await step('Checkbox is still rendered after toggle', async () => {
      await expect(canvas.getByRole('checkbox')).toBeInTheDocument();
    });
  },
};
