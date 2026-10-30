import { RepresentationService } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { NEVER, of } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { STORY_PROVIDERS } from '../stories.helpers';
import { TableImageCellComponent } from './table-image-cell.component';

/** A 40×30 still, far smaller than the preview card. */
const THUMBNAIL = new Blob(
  ['<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="#8aa"/></svg>'],
  { type: 'image/svg+xml' }
);

const IMAGE = {
  url: 'https://iiif.example.org/0001/still.jpx/full/,64/0/default.jpg',
  previewUrl: 'https://iiif.example.org/0001/still.jpx/full/,600/0/default.jpg',
  isSipi: true,
};

/** Serves the thumbnail and holds the larger rendition back, as a slow Sipi would. */
const representationServiceStub: Partial<RepresentationService> = {
  getImageBlob: (url: string) => (url === IMAGE.url ? of(THUMBNAIL) : NEVER),
};

const meta: Meta<TableImageCellComponent> = {
  title: 'Data Browser / Table Image Cell / Hover Preview',
  component: TableImageCellComponent,
  decorators: [
    applicationConfig({
      providers: [...STORY_PROVIDERS, { provide: RepresentationService, useValue: representationServiceStub }],
    }),
  ],
  args: { image: IMAGE, label: 'BRAUT001a' },
  argTypes: {
    image: {
      description: 'IIIF requests for the cell thumbnail and the larger preview, and whether Sipi serves them.',
    },
    label: { description: "The row's label, named in the thumbnail's and the preview's accessible names." },
  },
};

export default meta;
type Story = StoryObj<TableImageCellComponent>;

/** The thumbnail stands in until the larger rendition arrives; it used to open at its own size and jump (DEV-7674). */
export const DrawsThePreviewAtItsFinalSizeBeforeTheLargerImageArrives: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /BRAUT001a/ }));

    // The preview is an overlay, outside the canvas.
    const card = await waitFor(() => {
      const element = document.querySelector<HTMLElement>('[data-cy="image-preview"]');
      expect(element?.querySelector('img')?.complete).toBe(true);
      return element!;
    });
    const style = getComputedStyle(card);
    const content = card.getBoundingClientRect();
    const image = card.querySelector('img')!.getBoundingClientRect();

    await expect(image.width).toBe(content.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    await expect(image.height).toBe(content.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
  },
};
