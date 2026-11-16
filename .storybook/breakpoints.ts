/**
 * The widths that the `Pages / Breakpoints / …` stories are checked at, in Storybook's viewport
 * toolbar and in the separate pixeleye run (`pixeleye.breakpoints.config.ts`).
 *
 * Mirrors the breakpoint tokens of `apps/dsp-app/src/styles/_responsive.scss` (DEV-7536):
 * sm 768 · md 1280 · lg 1536 · xl 1920 · xxl 2560, plus 767 to show the layout just below the
 * minimum supported width.
 */
export const BREAKPOINT_WIDTHS = [767, 768, 1280, 1536, 1920, 2560] as const;

export const BREAKPOINT_HEIGHT = 900;

export const BREAKPOINT_VIEWPORTS = Object.fromEntries(
  BREAKPOINT_WIDTHS.map(width => [
    `bp${width}`,
    { name: `${width}px`, styles: { width: `${width}px`, height: `${BREAKPOINT_HEIGHT}px` }, type: 'desktop' },
  ])
);
