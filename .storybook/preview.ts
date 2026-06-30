import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { applicationConfig, componentWrapperDecorator, type Preview } from '@storybook/angular';
import { configure } from 'storybook/test';

configure({ testIdAttribute: 'data-cy' });

function initTranslations(translate: TranslateService) {
  return () => translate.use('en');
}

const preview: Preview = {
  decorators: [
    componentWrapperDecorator(story => `<div style="max-width: 1200px; margin: 0 auto;">${story}</div>`),
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
    options: {
      storySort: {
        method: 'alphabetical',
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
