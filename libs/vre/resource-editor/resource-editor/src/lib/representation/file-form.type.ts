import { FormControl, FormGroup } from '@angular/forms';
import { ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';

export type CreateResourceFormLegal = FormGroup<{
  copyrightHolder: FormControl<string | null>;
  license: FormControl<ProjectLicenseDto | null>;
  authorship: FormControl<string[] | null>;
}>;

export type FileForm = FormGroup<{
  link: FormControl<string | null>;
  legal: CreateResourceFormLegal;
}>;
