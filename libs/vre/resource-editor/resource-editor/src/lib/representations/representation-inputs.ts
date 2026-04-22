import { ReadValue } from '@dasch-swiss/dsp-js';

export interface FileRepresentationInput {
  fileUrl: string;
  userHasPermission: string;
  filename: string;
}

export interface ParentResourceInput {
  id: string;
  attachedToProject: string;
  type: string;
  properties: Record<string, ReadValue[]>;
}
