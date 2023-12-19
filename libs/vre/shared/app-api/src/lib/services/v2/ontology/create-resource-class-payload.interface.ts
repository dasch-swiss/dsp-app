import { CreateResourceClass } from './create-resource-class.interface';

export interface CreateResourceClassPayload extends CreateResourceClass {
  '@id': string;
}
