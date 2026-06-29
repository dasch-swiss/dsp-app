import { Injectable } from '@angular/core';
import { TranslationObject } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Observable } from 'rxjs';

/**
 * Languages without their own translation file are served another language's
 * file. Romansch (`rm`) has no translations yet, so it reuses the English
 * (`en`) strings instead of maintaining a duplicate `rm.json`. Drop the entry
 * (and add `rm.json`) once real Romansch translations exist. See DEV-6629.
 */
const TRANSLATION_FILE_FALLBACKS: Readonly<Record<string, string>> = { rm: 'en' };

@Injectable()
export class I18nFallbackTranslateLoader extends TranslateHttpLoader {
  override getTranslation(lang: string): Observable<TranslationObject> {
    return super.getTranslation(TRANSLATION_FILE_FALLBACKS[lang] ?? lang);
  }
}
