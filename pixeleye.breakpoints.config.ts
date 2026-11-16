import { DeviceDescriptor, devices } from '@pixeleye/cli-devices';
import { BREAKPOINT_HEIGHT, BREAKPOINT_WIDTHS } from './.storybook/breakpoints';

// Captures the `Pages / Breakpoints / …` stories (`*.breakpoints.stories.ts`) at every breakpoint
// width. Pixeleye shoots each story at the config's devices only, and media queries follow the
// viewport, so the widths have to be devices here rather than anything set inside a story.
//
// Kept apart from pixeleye.config.ts so the main baseline is untouched: it runs against a
// Storybook built with only those stories (`npm run build-storybook:breakpoints`) and uploads
// to its own pixeleye project (PIXELEYE_BREAKPOINTS_TOKEN). Two builds for one commit in the
// same project would overwrite each other.
const desktop = (width: number): DeviceDescriptor => ({
  ...devices['Desktop Chrome'],
  name: `Desktop ${width}px` as DeviceDescriptor['name'],
  viewport: { width, height: BREAKPOINT_HEIGHT },
});

export default {
  token: process.env['PIXELEYE_BREAKPOINTS_TOKEN'] || '',
  endpoint: process.env['PIXELEYE_ENDPOINT'] || 'http://localhost:5001',
  devices: BREAKPOINT_WIDTHS.map(desktop),
  // The main run's booth (default port 3003) outlives its CLI process, and CI runs this capture
  // in the same job right after it, so this one needs a port of its own.
  boothPort: '3004',
  waitForStatus: false,
};
