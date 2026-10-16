import { Location } from '@angular/common';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CookiePolicyComponent } from './cookie-policy.component';

const back = fn();

const meta: Meta<CookiePolicyComponent> = {
  title: 'Pages / System / Cookie Policy',
  component: CookiePolicyComponent,
  argTypes: {},
  decorators: [applicationConfig({ providers: [{ provide: Location, useValue: { back } }] })],
};
export default meta;
type Story = StoryObj<CookiePolicyComponent>;

export const ShowsCookiePolicy: Story = {
  name: 'Shows the cookie policy title',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Policy title is visible', async () => {
      await expect(
        await canvas.findByRole('heading', { name: 'Cookie Policy for DSP-API web application' })
      ).toBeInTheDocument();
    });
  },
};

export const NavigatesBackWhenBackIsClicked: Story = {
  name: 'Navigates back when the Back button is clicked',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    back.mockClear();
    await step('Click Back', async () => {
      await userEvent.click(await canvas.findByRole('button', { name: /Back/ }));
    });
    await step('Location.back() is called', async () => {
      await expect(back).toHaveBeenCalledOnce();
    });
  },
};
