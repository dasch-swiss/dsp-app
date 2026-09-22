import { OverlayModule } from '@angular/cdk/overlay';
import { Component, importProvidersFrom, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Cardinality, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, waitFor } from 'storybook/test';
import { makeClassPropertyInfo, STORY_PROVIDERS } from '../../../stories.helpers';
import { CardinalityChangeDialogComponent, CardinalityInfo } from './cardinality-change-dialog.component';

const classProp = makeClassPropertyInfo();

const classLabels = [{ language: 'en', value: 'Test Class' }];

const canDoCardinalityData: CardinalityInfo = {
  classIri: 'http://0.0.0.0:3333/ontology/0001/test/v2#TestClass',
  classLabels,
  currentCardinality: Cardinality._0_1,
  targetCardinality: Cardinality._0_n,
  propertyInfo: classProp,
};

const cannotDoCardinalityData: CardinalityInfo = {
  classIri: 'http://0.0.0.0:3333/ontology/0001/test/v2#TestClass',
  classLabels,
  currentCardinality: Cardinality._0_n,
  targetCardinality: Cardinality._1,
  propertyInfo: classProp,
};

@Component({
  selector: 'app-cardinality-dialog-launcher',
  template: ``,
})
class CardinalityDialogLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  private _data = inject<CardinalityInfo>(MAT_DIALOG_DATA);
  ngOnInit() {
    this._dialog.open(CardinalityChangeDialogComponent, { data: this._data });
  }
}

const meta: Meta<CardinalityDialogLauncherComponent> = {
  title: 'Ontology Editor / 3a. Resource Classes Tab / Resource Class Info / Cardinality Change Dialog',
  component: CardinalityDialogLauncherComponent,
};
export default meta;
type Story = StoryObj<CardinalityDialogLauncherComponent>;

const sharedProviders = [provideAnimations(), importProvidersFrom(OverlayModule), ...STORY_PROVIDERS];

export const CanChangeCardinality: Story = {
  name: 'Shows confirmation prompt when cardinality change is allowed',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: { onto: { canReplaceCardinalityOfResourceClassWith: () => of({ canDo: true }) } },
          } as unknown as Partial<KnoraApiConnection>,
        },
        { provide: MAT_DIALOG_DATA, useValue: canDoCardinalityData },
      ],
    }),
  ],
  play: async ({ step }) => {
    await step('Dialog is rendered', async () => {
      await waitFor(() => {
        const container = document.querySelector('mat-dialog-container');
        expect(container).not.toBeNull();
      });
    });
    await step('Subtitle names the property by its own label, not its type (DEV-6649)', async () => {
      await waitFor(() => {
        const subtitle = document.querySelector('mat-dialog-container .subtitle');
        // "Title" is the property's label; "Text"/"Short" is its DefaultProperty type, which used
        // to be rendered here instead.
        expect(subtitle?.textContent).toContain('Title');
        expect(subtitle?.textContent).not.toContain('Text');
      });
    });
  },
};

export const CannotChangeCardinality: Story = {
  name: 'Shows error message when cardinality change is not allowed',
  decorators: [
    applicationConfig({
      providers: [
        ...sharedProviders,
        {
          provide: DspApiConnectionToken,
          useValue: {
            v2: {
              onto: {
                canReplaceCardinalityOfResourceClassWith: () =>
                  of({ canDo: false, cannotDoReason: 'is not included in the new cardinality' }),
              },
            },
          } as unknown as Partial<KnoraApiConnection>,
        },
        { provide: MAT_DIALOG_DATA, useValue: cannotDoCardinalityData },
      ],
    }),
  ],
  play: async ({ step }) => {
    await step('Dialog is rendered', async () => {
      await waitFor(() => {
        const container = document.querySelector('mat-dialog-container');
        expect(container).not.toBeNull();
      });
    });
    await step('Error message names the property and the class by their labels (DEV-6649)', async () => {
      await waitFor(() => {
        const content = document.querySelector('mat-dialog-container')?.textContent ?? '';
        expect(content).toContain('Title');
        // The class used to be shown as the raw IRI fragment ("TestClass").
        expect(content).toContain('Test Class');
        expect(content).not.toContain('TestClass');
      });
    });
  },
};
