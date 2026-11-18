import { TemplatePortal } from '@angular/cdk/portal';
import {
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Signal,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import { DataModelsRailState } from './data-models-rail-state';

/**
 * Shows a section's toolbar (its search, its create button, its view tools) in the tab's bar rather than in the
 * section, for as long as the section shows; arriving on it, its search takes the focus. Call in an injection context.
 */
export function showToolbarInBar(
  toolbar: Signal<TemplateRef<unknown> | undefined>,
  search: Signal<ElementRef<HTMLInputElement> | undefined>
): void {
  const state = inject(DataModelsRailState);
  const viewContainer = inject(ViewContainerRef);
  let portal: TemplatePortal | undefined;
  effect(() => {
    const template = toolbar();
    if (!template) return;
    portal = new TemplatePortal(template, viewContainer);
    untracked(() => state.toolbar.set(portal));
  });
  // Typing finds what the section lists, once its search shows in the bar.
  effect(() => search()?.nativeElement.focus());
  inject(DestroyRef).onDestroy(() => {
    if (state.toolbar() === portal) state.toolbar.set(undefined);
  });
}
