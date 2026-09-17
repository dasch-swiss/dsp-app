import { ReadGeolocationValue } from '@dasch-swiss/dsp-js';
import { type Meta, type StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';

import { CRS_84, CRS_LV95 } from '../value-components/geolocation-crs';
import { GeolocationViewerComponent } from './geolocation-viewer.component';

const readValue = (geolocation: string, crs = '', shape = '', coordinates = ''): ReadGeolocationValue =>
  ({ geolocation, crs, shape, coordinates }) as ReadGeolocationValue;

const meta: Meta<GeolocationViewerComponent> = {
  title:
    'Resource Editor / 4. Properties / Resource Default Tabs / Properties Display / Template Switcher / Geolocation Viewer',
  component: GeolocationViewerComponent,
  argTypes: {
    value: {
      description: 'The geolocation value to display, as read from dsp-api.',
      table: { type: { summary: 'ReadGeolocationValue' }, category: 'Input' },
    },
  },
};
export default meta;
type Story = StoryObj<GeolocationViewerComponent>;

/** T6 — REQ-3.6: text only, and no network request for map tiles. */
export const DisplaysCoordinatesAndCrsWithoutLoadingTiles: Story = {
  name: 'Displays the coordinates and the CRS as text, loading no map tiles',
  args: {
    value: readValue(`<${CRS_84.iri}> POINT(8.550 47.37)`, CRS_84.iri, 'Point', '8.550 47.37'),
  },
  play: async ({ canvasElement, step }) => {
    await step('The coordinates are shown with their precision intact', async () => {
      const text = canvasElement.querySelector('[data-cy="geolocation-coordinates"]')?.textContent ?? '';
      await expect(text).toContain('8.550');
      await expect(text).toContain('47.37');
    });
    await step('The CRS is shown by its label, with the IRI available on hover', async () => {
      const crs = canvasElement.querySelector('[data-cy="geolocation-crs"]');
      await expect(crs?.textContent).toContain('WGS84');
      await expect(crs?.getAttribute('title')).toBe(CRS_84.iri);
    });
    await step('Nothing loads an image or an iframe', async () => {
      await expect(canvasElement.querySelectorAll('img, iframe, canvas').length).toBe(0);
    });
  },
};

export const ShowsProjectedOrdinateNames: Story = {
  name: 'Names the ordinates easting and northing for a projected CRS',
  args: {
    value: readValue(`<${CRS_LV95.iri}> POINT(2600000 1200000)`, CRS_LV95.iri, 'Point', '2600000 1200000'),
  },
  play: async ({ canvasElement, step }) => {
    await step('The ordinates are labelled for a projected CRS', async () => {
      const text = canvasElement.textContent ?? '';
      await expect(text).toContain('Easting');
      await expect(text).toContain('Northing');
    });
  },
};

/** The lenient read path: a geometry this release cannot edit still reads back as stored. */
export const FallsBackToTheStoredLiteralForAnUneditableGeometry: Story = {
  name: 'Shows the stored literal for a geometry it cannot lay out as a coordinate pair',
  args: {
    value: readValue(
      `<${CRS_84.iri}> LINESTRING(8.55 47.37, 8.56 47.38)`,
      CRS_84.iri,
      'LineString',
      '8.55 47.37, 8.56 47.38'
    ),
  },
  play: async ({ canvasElement, step }) => {
    await step('The coordinates are shown verbatim rather than dropped', async () => {
      const text = canvasElement.querySelector('[data-cy="geolocation-coordinates"]')?.textContent ?? '';
      await expect(text).toContain('8.55 47.37, 8.56 47.38');
    });
  },
};
