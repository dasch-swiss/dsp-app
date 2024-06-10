import { MatDialogConfig } from '@angular/material/dialog';

export class DspDialogConfig {
  static dialogDrawerConfig<T = any>(dialogData?: T): MatDialogConfig<T> {
    return {
      minHeight: 'calc(100vh)',
      minWidth: 600,
      maxWidth: '100%',
      position: {
        right: '0px',
      },
      autoFocus: true,
      enterAnimationDuration: 0,
      exitAnimationDuration: 0,
      data: dialogData,
    };
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
