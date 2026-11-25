import { MatDialog } from '@angular/material/dialog';

/**
 * Whether an Esc pressed anywhere on a Data models page should close its side panel: not while typing, where Esc has
 * its own job, nor while a menu or dialog is open, which Esc closes first. An open menu takes the Esc itself, which
 * `defaultPrevented` tells.
 */
export function escapeClosesPanel(event: Event, dialog: MatDialog): boolean {
  const target = event.target as HTMLElement | null;
  if (event.defaultPrevented || target?.closest('input, textarea, [contenteditable="true"]')) return false;
  return !dialog.openDialogs.length;
}
