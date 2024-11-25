import { FormControl, FormGroup } from '@angular/forms';
import { ReadStillImageExternalFileValue } from '@dasch-swiss/dsp-js';

export interface ThirdPartyIiifProps {
  resourceId: string;
  fileValue: ReadStillImageExternalFileValue;
}

export type ThirdPartyIiiifForm = FormGroup<{ fileValue: FormControl<ReadStillImageExternalFileValue | null> }>;
