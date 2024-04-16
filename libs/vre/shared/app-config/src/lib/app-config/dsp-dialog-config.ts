import { MatDialogConfig } from '@angular/material/dialog';

export class DspDialogConfig {
  static dialogDrawerConfig<T = any>(dialogData?: T): MatDialogConfig<T> {
    return {
      height: 'calc(100vh)',
      position: {
        right: '0px',
      },
      autoFocus: true,
      enterAnimationDuration: 0,
      exitAnimationDuration: 0,
      data: dialogData,
    };
  }
}
