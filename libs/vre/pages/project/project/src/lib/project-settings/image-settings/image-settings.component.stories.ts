import { ActivatedRoute } from '@angular/router';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, within } from 'storybook/test';
import { STORY_PROVIDERS } from '../../stories.helpers';
import { ImageSettingsComponent } from './image-settings.component';

const projectIri = 'http://rdfh.ch/projects/0001';

const settingsProviders = (settings: { size?: string; watermark: boolean }, isDefault: boolean) => [
  ...STORY_PROVIDERS,
  { provide: ProjectService, useValue: { uuidToIri: () => projectIri } },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  {
    provide: ActivatedRoute,
    useValue: { parent: { parent: { snapshot: { paramMap: new Map([['uuid', 'a-uuid']]) } } } },
  },
  {
    provide: AdminAPIApiService,
    useValue: {
      getAdminProjectsIriProjectiriRestrictedviewsettings: () => of({ settings, isDefault }),
      postAdminProjectsIriProjectiriRestrictedviewsettings: () => of({ settings, isDefault: false }),
      deleteAdminProjectsIriProjectiriRestrictedviewsettings: () =>
        of({ settings: { size: '!128,128', watermark: false }, isDefault: true }),
    },
  },
];

const meta: Meta<ImageSettingsComponent> = {
  // Nested rather than `.../Image Settings`, which is a strict prefix of the sibling
  // Image Display Absolute / Ratio titles and would collide with their sidebar group.
  title: 'Pages / Project / Settings Tab / Image Settings / Image Settings Form',
  component: ImageSettingsComponent,
};
export default meta;
type Story = StoryObj<ImageSettingsComponent>;

export const NothingStored: Story = {
  name: 'Lands on Default and names the inherited limit when the project stores nothing',
  decorators: [applicationConfig({ providers: settingsProviders({ size: '!128,128', watermark: false }, true) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Default is the selected radio', async () => {
      await expect(canvas.getByRole('radio', { name: /default/i })).toBeChecked();
    });

    await step('The inherited limit is shown', async () => {
      await expect(canvas.getByText(/128/)).toBeInTheDocument();
    });

    await step('Submit is disabled until something changes', async () => {
      await expect(canvas.getByRole('button', { name: /submit/i })).toBeDisabled();
    });
  },
};

export const WatermarkStored: Story = {
  name: 'Lands on Apply watermark when a watermark is stored',
  decorators: [applicationConfig({ providers: settingsProviders({ watermark: true }, false) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Apply watermark is the selected radio', async () => {
      await expect(canvas.getByRole('radio', { name: /watermark/i })).toBeChecked();
    });

    await step('No inherited limit is shown, because the project set its own', async () => {
      await expect(canvas.queryByText(/platform default/i)).not.toBeInTheDocument();
    });
  },
};

export const SizeStored: Story = {
  name: 'Lands on Restrict image size when a size is stored',
  decorators: [applicationConfig({ providers: settingsProviders({ size: 'pct:13', watermark: false }, false) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Restrict image size is the selected radio', async () => {
      await expect(canvas.getByRole('radio', { name: /restrict image size/i })).toBeChecked();
    });
  },
};

export const SwitchingToDefaultEnablesSubmit: Story = {
  name: 'Enables Submit after switching from a stored size to Default',
  decorators: [applicationConfig({ providers: settingsProviders({ size: 'pct:13', watermark: false }, false) })],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Submit starts disabled', async () => {
      await expect(canvas.getByRole('button', { name: /submit/i })).toBeDisabled();
    });

    await step('Choosing Default enables it', async () => {
      await userEvent.click(canvas.getByRole('radio', { name: /default/i }));
      await expect(canvas.getByRole('button', { name: /submit/i })).toBeEnabled();
    });
  },
};
