import { AvailableLanguageKeys } from '@dasch-swiss/vre/core/config';

/** The texts of a class or a property that come in several languages. */
export type TextKind = 'label' | 'description';

/** The languages a label or description can have, in the order the app lists them. */
export const DESCRIPTION_LANGUAGES: readonly string[] = AvailableLanguageKeys;
