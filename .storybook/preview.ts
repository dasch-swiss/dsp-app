import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { applicationConfig, componentWrapperDecorator, type Preview } from '@storybook/angular';
import { configure } from 'storybook/test';
import { BREAKPOINT_VIEWPORTS } from './breakpoints';

configure({ testIdAttribute: 'data-cy' });

// Point "Material Icons" at the same fixed URL that `preview-head.html` preloads (DEV-7525).
// The app's own @font-face uses a content-hashed file name, which a static preload cannot
// match. This <style> is appended after main.css, so it wins over the app's face, and it is
// part of the DOM pixeleye serializes, so its re-rendered copy uses the preloaded font too.
const iconFontFace = document.createElement('style');
iconFontFace.textContent = `@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: url('assets/fonts/material-icons/MaterialIcons-Regular.ttf') format('truetype');
}`;
document.head.appendChild(iconFontFace);

function initTranslations(translate: TranslateService) {
  return () => translate.use('en');
}

const centeredColumn = componentWrapperDecorator(
  story => `<div style="max-width: 1200px; margin: 0 auto;">${story}</div>`
);

const preview: Preview = {
  decorators: [
    // Full-page stories (`layout: 'fullscreen'`, e.g. `Pages / Breakpoints / …`) must span the
    // whole viewport, or their layout would be squeezed into a 1200px column.
    (storyFn, context) =>
      context.parameters['layout'] === 'fullscreen' ? storyFn() : centeredColumn(storyFn, context),
    applicationConfig({
      providers: [
        provideAnimations(),
        // Angular Material times its own transitions in JS, not from the CSS we freeze in
        // `preview-head.html`. `MatDialogContainer._startOpenAnimation` calls
        // `_waitForAnimationToComplete(OPEN_ANIMATION_DURATION, ...)` — a hard-coded
        // `setTimeout(cb, 150)` — and the initial focus trap only runs in that callback
        // (`delayFocusTrap: true`). Freezing the CSS alone therefore makes a dialog *look*
        // open at once while its first field stays unfocused for another 150ms, so pixeleye
        // photographs the focused or unfocused form field depending on the run (DEV-7238).
        //
        // This token collapses every Material duration to 0: the dialog resolves its open on
        // a microtask and traps focus immediately, and `mat-progress-spinner` switches to the
        // static `_mat-animation-noopable` ring it ships for exactly this purpose. Stories add
        // their own `provideAnimations()`, but that sets `ANIMATION_MODULE_TYPE`, a different
        // token, and `applicationConfig` concatenates providers — so this survives underneath.
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
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
    viewport: { options: BREAKPOINT_VIEWPORTS },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
