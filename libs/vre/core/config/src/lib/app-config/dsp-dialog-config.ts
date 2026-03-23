import { MatDialogConfig } from '@angular/material/dialog';

export class DspDialogConfig {
  static dialogDrawerConfig<T = any>(dialogData?: T, isSideDialog = false): MatDialogConfig<T> {
    const dialogConfig = {
      height: 'calc(100vh)',
      minWidth: 600,
      maxWidth: '100%',
      autoFocus: true,
      enterAnimationDuration: 0,
      exitAnimationDuration: 0,
      data: dialogData,
    };

    if (isSideDialog) {
      Object.assign(dialogConfig, { position: { right: '0px' } });
    }

    return dialogConfig;
  }

  static smallDialog<T = any>(dialogData?: T): MatDialogConfig<T> {
    return {
      minWidth: 500,
      data: dialogData,
    };
  }

  static mediumDialog<T = any>(dialogData?: T): MatDialogConfig<T> {
    return {
      minWidth: 800,
      data: dialogData,
    };
  }
}
