import { Component, OnInit } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-viewer',
  template: `
    <ng-container *ngIf="compoundService.compoundPosition">
      <ng-container *ngIf="compoundService.incomingResource$ | async as incomingResource">
        <app-still-image class="dsp-representation" [resource]="incomingResource.res" [compoundMode]="true" />
      </ng-container>
    </ng-container>
  `,
})
export class CompoundViewerComponent {
  constructor(public compoundService: CompoundService) {}
}
