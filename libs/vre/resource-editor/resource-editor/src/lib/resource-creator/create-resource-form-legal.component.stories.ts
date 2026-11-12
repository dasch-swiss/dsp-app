import { FormControl, FormGroup } from '@angular/forms';
import { LegalInfoApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { applicationConfig, componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, userEvent, waitFor } from 'storybook/test';
import { provideCompactFormFieldOptions } from '../properties/properties-display/template-switcher/compact-form-field-options';

import { CreateResourceFormLegalComponent } from './create-resource-form-legal.component';

const makeFormGroup = () =>
  new FormGroup({
    copyrightHolder: new FormControl<string | null>(null),
    license: new FormControl<any | null>(null),
    authorship: new FormControl<string[] | null>([]),
  });

const LEGAL_PROVIDERS = [
  { provide: LegalInfoApiService, useValue: { get: () => of([]), getAuthorships: () => of([]) } },
  {
    provide: AdminAPIApiService,
    useValue: {
      getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses: () => of({ data: [] }),
      getAdminProjectsShortcodeProjectshortcodeLegalInfoCopyrightHolders: () => of({ data: [] }),
    },
  },
];

const meta: Meta<CreateResourceFormLegalComponent> = {
  title: 'Resource Creator / 2. Legal / Create Resource Form Legal',
  component: CreateResourceFormLegalComponent,
  decorators: [applicationConfig({ providers: LEGAL_PROVIDERS })],
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

export const EmptyOptionSaysNotSpecified: Story = {
  name: 'Offers "Not specified" as the empty license option',
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: LegalInfoApiService,
          useValue: {
            getLicenses: () => of([]),
            getCopyrightHolders: () => of([]),
            getAuthorships: () => of([]),
          },
        },
      ],
    }),
  ],
  args: {
    formGroup: makeFormGroup() as any,
    projectShortcode: 'test',
  },
  play: async ({ canvasElement, step }) => {
    await step('Open the license list', async () => {
      await userEvent.click(canvasElement.querySelector('[data-cy="license-select"]') as HTMLElement);
    });
    await step('The first option reads "Not specified", not "None"', async () => {
      await waitFor(() => expect(document.querySelector('mat-option')?.textContent?.trim()).toBe('Not specified'));
    });
    await step('Choosing "Not specified" keeps it visible in the field', async () => {
      await userEvent.click(document.querySelector('mat-option') as HTMLElement);
      const select = canvasElement.querySelector('[data-cy="license-select"]') as HTMLElement;
      await waitFor(() =>
        expect(select.querySelector('.mat-mdc-select-value-text')?.textContent?.trim()).toBe('Not specified')
      );
    });
  },
};

/**
 * In the create form the fields are compact and reserve no error line, so the rows need their own gap, and the
 * Authorship field must start level with its label.
 */
export const SpacesTheRowsAndLevelsEachFieldWithItsLabelInTheCompactForm: Story = {
  args: {
    formGroup: makeFormGroup() as any,
    projectShortcode: 'test',
  },
  decorators: [
    applicationConfig({ providers: [...LEGAL_PROVIDERS, provideCompactFormFieldOptions()] }),
    componentWrapperDecorator(story => `<div class="compact-value-editor">${story}</div>`),
  ],
  play: async ({ canvasElement, step }) => {
    const rows = Array.from(canvasElement.querySelectorAll<HTMLElement>('app-create-resource-form-row'));
    await expect(rows).toHaveLength(3);

    await step('Each row is 16px below the one above it', async () => {
      for (let i = 1; i < rows.length; i++) {
        const gap = rows[i].getBoundingClientRect().top - rows[i - 1].getBoundingClientRect().bottom;
        await expect(gap).toBe(16);
      }
    });

    await step('Every field starts level with its label', async () => {
      const offset = (row: HTMLElement) =>
        row.querySelector('mat-form-field')!.getBoundingClientRect().top -
        row.querySelector('h3')!.getBoundingClientRect().top;
      for (const row of rows) {
        await expect(offset(row)).toBe(offset(rows[0]));
      }
    });
  },
};
