import { OverlayModule } from '@angular/cdk/overlay';
import { importProvidersFrom } from '@angular/core';
import { FormControl } from '@angular/forms';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, userEvent } from 'storybook/test';

import { CRS_84, CRS_LV95, GeolocationFormValue } from './geolocation-crs';
import { GeolocationValueComponent } from './geolocation-value.component';

const control = (value: GeolocationFormValue | null) => new FormControl<GeolocationFormValue | null>(value);

const openCrsSelect = async (canvasElement: HTMLElement) => {
  const trigger = canvasElement.querySelector('[data-cy="crs-select"] .mat-mdc-select-trigger');
  await userEvent.click(trigger as HTMLElement);
};

const meta: Meta<GeolocationValueComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Geolocation Value',
  component: GeolocationValueComponent,
  decorators: [applicationConfig({ providers: [importProvidersFrom(OverlayModule)] })],
  argTypes: {
    control: {
      description:
        'FormControl bound to the composite geolocation value: the CRS definition IRI and both ordinates as strings.',
      table: { type: { summary: 'FormControl<{ crs: string; x: string; y: string } | null>' }, category: 'State' },
    },
  },
};
export default meta;
type Story = StoryObj<GeolocationValueComponent>;

/** T1 — REQ-3.2: the silent-relabel trap. */
export const InitialisesCrsFromStoredValue: Story = {
  name: 'Opens the CRS selector on the stored value’s own CRS, not on a default',
  args: { control: control({ crs: CRS_LV95.iri, x: '2600000', y: '1200000' }) },
  play: async ({ canvasElement, step }) => {
    await step('The selector shows the stored CRS', async () => {
      const trigger = canvasElement.querySelector('[data-cy="crs-select"]');
      await expect(trigger?.textContent).toContain('LV95');
    });
    await step('The ordinates are labelled for a projected CRS, not a geographic one', async () => {
      const labels = canvasElement.textContent ?? '';
      await expect(labels).toContain('Easting');
      await expect(labels).toContain('Northing');
      await expect(labels).not.toContain('Longitude');
    });
  },
};

/** T2 — REQ-3.4. */
export const WarnsWhenCrsChangesWithoutCoordinates: Story = {
  name: 'Warns that changing the CRS reinterprets the coordinates rather than converting them',
  args: { control: control({ crs: CRS_84.iri, x: '8.55', y: '47.37' }) },
  play: async ({ canvasElement, step }) => {
    await step('No warning before the CRS is touched', async () => {
      await expect(canvasElement.querySelector('[data-cy="crs-reinterpretation-warning"]')).toBeNull();
    });
    await step('Selecting a different CRS warns', async () => {
      await openCrsSelect(canvasElement);
      const option = document.querySelector(`[data-cy="crs-option-${CRS_LV95.iri}"]`);
      await userEvent.click(option as HTMLElement);
      await expect(document.querySelector('[data-cy="crs-reinterpretation-warning"]')).not.toBeNull();
    });
  },
};

/** T3 — REQ-3.7 and REQ-5.10, and the JSON-LD scalar-vs-array case from Phase A2. */
export const PreservesTrailingZeroesOnRoundTrip: Story = {
  name: 'Round-trips a coordinate’s trailing zeroes unaltered',
  args: { control: control({ crs: CRS_84.iri, x: '8.550', y: '47.3700' }) },
  play: async ({ args, canvasElement, step }) => {
    await step('The inputs render the submitted lexical form, not a normalised number', async () => {
      const x = canvasElement.querySelector('[data-cy="x-input"]') as HTMLInputElement;
      const y = canvasElement.querySelector('[data-cy="y-input"]') as HTMLInputElement;
      await expect(x.value).toBe('8.550');
      await expect(y.value).toBe('47.3700');
    });
    await step('Editing one ordinate leaves the other’s precision intact', async () => {
      const x = canvasElement.querySelector('[data-cy="x-input"]') as HTMLInputElement;
      await userEvent.type(x, '0');
      await expect(args.control.value).toEqual({ crs: CRS_84.iri, x: '8.5500', y: '47.3700' });
    });
  },
};

/** T4 — REQ-3.5. */
export const ShowsErrorWhenCoordinateOutOfRangeForCrs: Story = {
  name: 'Reports an out-of-range coordinate inline and blocks submission',
  args: { control: control({ crs: CRS_84.iri, x: '8.55', y: '47.37' }) },
  play: async ({ args, canvasElement, step }) => {
    const y = canvasElement.querySelector('[data-cy="y-input"]') as HTMLInputElement;
    await step('A latitude beyond ±90 is rejected', async () => {
      await userEvent.clear(y);
      await userEvent.type(y, '947.37');
      await expect(canvasElement.querySelector('[data-cy="y-error"]')).not.toBeNull();
    });
    await step('The error names the ordinate, the CRS and the valid range', async () => {
      const message = canvasElement.querySelector('[data-cy="y-error"]')?.textContent ?? '';
      await expect(message).toContain('Latitude');
      await expect(message).toContain('90');
    });
    await step('Submission is blocked', async () => {
      await expect(args.control.invalid).toBe(true);
    });
  },
};

/** T5 — a field labelled "longitude" holding an easting is the confusion this type removes. */
export const RelabelsOrdinatesWhenCrsChanges: Story = {
  name: 'Relabels the ordinates when the CRS changes from geographic to projected',
  args: { control: control({ crs: CRS_84.iri, x: '8.55', y: '47.37' }) },
  play: async ({ canvasElement, step }) => {
    await step('A geographic CRS labels the ordinates longitude and latitude', async () => {
      await expect(canvasElement.textContent).toContain('Longitude');
      await expect(canvasElement.textContent).toContain('Latitude');
    });
    await step('A projected CRS labels them easting and northing', async () => {
      await openCrsSelect(canvasElement);
      const option = document.querySelector(`[data-cy="crs-option-${CRS_LV95.iri}"]`);
      await userEvent.click(option as HTMLElement);
      await expect(canvasElement.textContent).toContain('Easting');
      await expect(canvasElement.textContent).not.toContain('Longitude');
    });
  },
};
