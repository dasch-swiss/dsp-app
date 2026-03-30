import { APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { applicationConfig, type Preview } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

function initTranslations(translate: TranslateService) {
  return () => translate.use('en');
}

// Re-throw errors that Angular's zone catches, so Storybook play() failures
// are correctly reported as failing steps instead of being swallowed.
class RethrowingErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    throw error;
  }
}

const preview: Preview = {
  decorators: [
    applicationConfig({
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideTranslateService({ defaultLanguage: 'en' }),
        provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
        {
          provide: APP_INITIALIZER,
          useFactory: initTranslations,
          deps: [TranslateService],
          multi: true,
        },
        { provide: ErrorHandler, useClass: RethrowingErrorHandler },
      ],
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
