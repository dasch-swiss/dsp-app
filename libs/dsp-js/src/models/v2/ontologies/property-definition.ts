import { EntityDefinition } from './EntityDefinition';

/**
 * @category Internal
 */
export abstract class PropertyDefinition extends EntityDefinition {
  abstract subPropertyOf: string[];

  abstract subjectType?: string;

  abstract objectType?: string;
}
