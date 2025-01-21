import { Component, Input, OnChanges } from '@angular/core';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { ResourceSelectors, UserSelectors } from '@dasch-swiss/vre/core/state';
import {
  FileRepresentation,
  RepresentationConstants,
  getFileValue,
} from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-resource-representation',
  template: ` <div class="representation-container center" [ngSwitch]="representationToDisplay.fileValue.type">
    <app-still-image
      #stillImage
      class="dsp-representation stillimage"
      [compoundMode]="false"
      *ngSwitchCase="representationConstants.stillImage"
      [resource]="resource.res" />
    <app-still-image
      #stillImage
      [compoundMode]="false"
      class="dsp-representation stillimage"
      *ngSwitchCase="representationConstants.externalStillImage"
      [resource]="resource.res" />

    <app-document
      #document
      class="dsp-representation document"
      [class.pdf]="representationToDisplay.fileValue.filename.split('.').pop() === 'pdf'"
      *ngSwitchCase="representationConstants.document"
      [src]="representationToDisplay"
      [parentResource]="resource.res">
    </app-document>

    <app-audio
      #audio
      class="dsp-representation audio"
      *ngSwitchCase="representationConstants.audio"
      [src]="representationToDisplay"
      [parentResource]="resource.res"
      [isAdmin]="isAdmin$ | async">
    </app-audio>

    <app-video
      #video
      class="dsp-representation video"
      *ngSwitchCase="representationConstants.movingImage"
      [src]="representationToDisplay"
      [parentResource]="resource.res"
      [isAdmin]="isAdmin$ | async">
    </app-video>

    <app-archive
      #archive
      class="dsp-representation archive"
      *ngSwitchCase="representationConstants.archive"
      [src]="representationToDisplay"
      [parentResource]="resource.res">
    </app-archive>

    <app-text
      #text
      class="dsp-representation text"
      *ngSwitchCase="representationConstants.text"
      [src]="representationToDisplay"
      [parentResource]="resource.res">
    </app-text>
  </div>`,
})
export class ResourceRepresentationComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  representationToDisplay!: FileRepresentation;

  loading = false;
  protected readonly representationConstants = RepresentationConstants;

  get attachedToProjectResource(): string {
    return this.resource.res.attachedToProject;
  }

  isAdmin$: Observable<boolean> = combineLatest([
    this._store.select(UserSelectors.user),
    this._store.select(UserSelectors.userProjectAdminGroups),
  ]).pipe(
    map(([user, userProjectGroups]) => {
      return this.attachedToProjectResource
        ? ProjectService.IsProjectAdminOrSysAdmin(user!, userProjectGroups, this.attachedToProjectResource)
        : false;
    })
  );

  constructor(private _store: Store) {}

  ngOnChanges() {
    this.representationToDisplay = new FileRepresentation(getFileValue(this.resource)!);
  }
}
