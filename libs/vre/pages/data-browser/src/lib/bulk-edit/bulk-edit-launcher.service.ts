import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { Observable } from 'rxjs';
import { BulkEditDialogComponent, BulkEditDialogProps, BulkEditDialogResult } from './bulk-edit-dialog.component';

/**
 * Opens the bulk edit side panel, for a selection or for every resource a search matches. It stays
 * free of page-scoped services (MultipleViewerService lives on the data browser page, out of root's
 * reach): callers tell their open viewers about the changed resources.
 */
@Injectable({ providedIn: 'root' })
export class BulkEditLauncher {
  private readonly _dialog = inject(MatDialog);

  /**
   * Emits the IRIs of the resources whose values changed, once the panel closes (empty when nothing changed).
   * `scope` names which resources these are in the panel's header, e.g. what a search keeps.
   */
  open(resourceIris: string[], scope?: string): Observable<BulkEditDialogResult | undefined> {
    return this._dialog
      .open<BulkEditDialogComponent, BulkEditDialogProps, BulkEditDialogResult>(BulkEditDialogComponent, {
        ...DspDialogConfig.dialogDrawerConfig({ resourceIris, scope }, true),
        width: '600px',
        maxWidth: '100vw',
        minWidth: 0,
        autoFocus: false,
      })
      .afterClosed();
  }
}
