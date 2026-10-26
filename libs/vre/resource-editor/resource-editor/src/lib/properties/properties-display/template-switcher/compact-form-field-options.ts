import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';

/**
 * The form-field defaults of a compact host, paired with the global `.compact-value-editor` class
 * that sets the 36px density: outlined, because a filled field hides its label at that height, and
 * no error line reserved under a field that has no error to show.
 */
export const provideCompactFormFieldOptions = () => ({
  provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
  useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } satisfies MatFormFieldDefaultOptions,
});
