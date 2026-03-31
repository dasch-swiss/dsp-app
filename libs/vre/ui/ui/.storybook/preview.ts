import { APP_INITIALIZER } from '@angular/core';
import { applicationConfig, type Preview } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

function initTranslations(translate: TranslateService) {
  return () => translate.use('en');
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
