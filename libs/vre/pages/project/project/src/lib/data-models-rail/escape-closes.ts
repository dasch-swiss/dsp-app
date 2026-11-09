/**
 * Whether an Esc pressed anywhere on a Data models 2 page should close its side panel: not while typing, where Esc has
 * its own job, nor while a menu or dialog is open, which Esc closes first.
 */
export function escapeClosesPanel(event: Event): boolean {
  const target = event.target as HTMLElement | null;
  if (event.defaultPrevented || target?.closest('input, textarea, [contenteditable="true"]')) return false;
  return !document.querySelector('.mat-mdc-menu-panel, mat-dialog-container');
}
