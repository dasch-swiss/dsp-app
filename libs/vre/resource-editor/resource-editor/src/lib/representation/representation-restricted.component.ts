import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AlertInfoComponent } from '../header/alert-info.component';

/**
 * Shown in place of the media area when the resource is viewable but its file value is withheld,
 * i.e. `getFileValue()` returns `null` while `userHasPermission` is still `V`/`RV`/`CR`.
 *
 * Without this, the AV wrappers passed the `null` file value on to the player, which threw before
 * ever becoming ready and left the progress indicator spinning forever (DEV-7016). The wording is
 * deliberately media-neutral so the same component serves video, audio and their segments.
 */
@Component({
  selector: 'app-representation-restricted',
  imports: [AlertInfoComponent, TranslatePipe],
  template: `
    <app-alert-info>
      {{ 'resourceEditor.representations.noPermission' | translate }}
    </app-alert-info>
  `,
})
export class RepresentationRestrictedComponent {}
