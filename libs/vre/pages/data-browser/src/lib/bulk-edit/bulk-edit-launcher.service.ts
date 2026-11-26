import { inject, Injectable } from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { Observable } from 'rxjs';
import { BulkEditApplied, BulkEditDialogComponent, BulkEditDialogProps } from './bulk-edit-dialog.component';

/**
 * Opens the bulk edit side panel, for a selection or for every resource a search matches. It stays
 * free of page-scoped services (MultipleViewerService lives on the data browser page, out of root's
 * reach): callers tell their open viewers about the changed resources. Stateless (only `MatDialog`),
 * so root provision is correct (ADR-0003 d3).
 */
@Injectable({ providedIn: 'root' })
export class BulkEditLauncher {
  private readonly _dialog = inject(MatDialog);

  /**
   * Emits the IRIs of the resources each run changed, as soon as it ends, while the panel stays open; completes
   * when the panel closes. `scope` names which resources these are in the panel's header, e.g. what a search keeps;
   * `property` is the one the panel opens on.
   */
  open(resourceIris: string[], scope?: string, property?: string): Observable<BulkEditApplied> {
    const dialogRef = this._dialog.open<BulkEditDialogComponent, BulkEditDialogProps>(BulkEditDialogComponent, {
      ...DspDialogConfig.dialogDrawerConfig({ resourceIris, scope, property }, true),
      width: '1100px',
      maxWidth: '100vw',
      minWidth: 0,
      autoFocus: false,
      // The panel's heading names the dialog for screen readers.
      ariaLabelledBy: 'bulk-edit-title',
    });
    // An output observable completes when its component is destroyed, that is when the panel closes.
    return outputToObservable(dialogRef.componentInstance.applied);
  }
}
