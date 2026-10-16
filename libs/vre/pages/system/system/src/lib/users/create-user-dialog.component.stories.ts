import { MatDialogRef } from '@angular/material/dialog';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CreateUserDialogComponent } from './create-user-dialog.component';

const close = fn();
const create = fn(() => of({ user: { id: 'http://rdfh.ch/users/new' } }));

const meta: Meta<CreateUserDialogComponent> = {
  title: 'Pages / System / Users / Create User Dialog',
  component: CreateUserDialogComponent,
  argTypes: {},
  decorators: [
    applicationConfig({
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: UserApiService, useValue: { create } },
      ],
    }),
  ],
  beforeEach: () => {
    close.mockClear();
    create.mockClear();
  },
};
export default meta;
type Story = StoryObj<CreateUserDialogComponent>;

export const DoesNotSubmitInvalidForm: Story = {
  name: 'Does not create a user while the form is invalid',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Dialog title is shown', async () => {
      await expect(await canvas.findByText('Create a new user')).toBeInTheDocument();
    });
    await step('Submit the empty form', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    });
    await step('No user is created and the dialog stays open', async () => {
      await expect(create).not.toHaveBeenCalled();
      await expect(close).not.toHaveBeenCalled();
    });
  },
};

export const CreatesUserAndClosesWithItsId: Story = {
  name: 'Creates the user and closes with its id when the form is valid',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Fill in the user and password fields', async () => {
      await userEvent.type(await canvas.findByLabelText(/Username/), 'newuser');
      await userEvent.type(canvas.getByLabelText(/Email address/), 'new.user@example.com');
      await userEvent.type(canvas.getByLabelText(/First name/), 'New');
      await userEvent.type(canvas.getByLabelText(/Last name/), 'User');
      const [password, confirmPassword] = Array.from(
        canvasElement.querySelectorAll<HTMLInputElement>('app-password-confirm-form input')
      );
      await userEvent.type(password, 'secret123');
      await userEvent.type(confirmPassword, 'secret123');
    });
    await step('Submit', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    });
    await step('The user is created and the dialog closes with the new id', async () => {
      await expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'newuser', email: 'new.user@example.com', systemAdmin: false })
      );
      await expect(close).toHaveBeenCalledWith('http://rdfh.ch/users/new');
    });
  },
};
