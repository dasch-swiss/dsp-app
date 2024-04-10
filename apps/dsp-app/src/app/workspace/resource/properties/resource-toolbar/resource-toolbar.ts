import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  DeleteResource,
  DeleteResourceResponse,
  KnoraApiConnection,
  PermissionUtil,
  ReadLinkValue,
  ReadProject,
  ReadResource,
  ReadValue,
  UpdateResourceMetadata,
  UpdateResourceMetadataResponse,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import {
  Events as CommsEvents,
  ComponentCommunicationEventService,
  EmitEvent,
  OntologyService,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/shared/app-notification';
import {
  LoadClassItemsCountAction,
  ResourceSelectors,
  ToggleShowAllCommentsAction,
  ToggleShowAllPropsAction,
} from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ConfirmationWithComment, DialogComponent } from '../../../../main/dialog/dialog.component';
import { DspResource } from '../../dsp-resource';
import { ResourceService } from '../../services/resource.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-toolbar',
  templateUrl: './resource-toolbar.html',
  styleUrls: ['./resource-toolbar.scss'],
})
export class ResourceToolbarComponent implements OnInit {
  @Input() resource: DspResource;

  /**
   * does the logged-in user has system or project admin permissions?
   */
  @Input() adminPermissions = false;

  /**
   * in case properties belongs to an annotation (e.g. region in still images)
   * in this case we don't have to display the isRegionOf property
   */
  @Input() isAnnotation = false;

  @Input() showToggleProperties = false;
  @Input() showEditLabel = false;

  @Input() attachedProject: ReadProject;

  @Input() lastModificationDate: string;

  @Output() regionChanged: EventEmitter<ReadValue> = new EventEmitter<ReadValue>();
  @Output() regionDeleted: EventEmitter<void> = new EventEmitter<void>();

  userCanDelete: boolean;
  userCanEdit: boolean;

  canReadComments: boolean;

  get hasIconButtonActions() {
    return this.isAnnotation || !this.showToggleProperties;
  }

  @Select(ResourceSelectors.showAllProps) showAllProps$: Observable<boolean>;
  @Select(ResourceSelectors.showAllComments) showAllComments$: Observable<boolean>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _notification: NotificationService,
    private _resourceService: ResourceService,
    private _cd: ChangeDetectorRef,
    private _componentCommsService: ComponentCommunicationEventService,
    private _ontologyService: OntologyService,
    private _dialog: MatDialog,
    private _store: Store
  ) {}

  ngOnInit(): void {
    if (this.resource.res) {
      // get user permissions
      const allPermissions = PermissionUtil.allUserPermissions(
        this.resource.res.userHasPermission as 'RV' | 'V' | 'M' | 'D' | 'CR'
      );

      this.canReadComments = true; // allPermissions.indexOf(PermissionUtil.Permissions.RV) === -1; // TODO permissions to show comments should be provided
      // if user has modify permissions, set addButtonIsVisible to true so the user see's the add button
      this.userCanEdit = allPermissions.indexOf(PermissionUtil.Permissions.M) !== -1;
      this.userCanDelete = allPermissions.indexOf(PermissionUtil.Permissions.D) !== -1;
    }
  }

  /**
   * opens resource
   * @param linkValue
   */
  openResource(linkValue: ReadLinkValue | string) {
    const iri = typeof linkValue == 'string' ? linkValue : linkValue.linkedResourceIri;
    const path = this._resourceService.getResourcePath(iri);
    window.open(`/resource${path}`, '_blank');
  }

  toggleShowAllProps() {
    this._store.dispatch(new ToggleShowAllPropsAction());
  }

  toggleShowAllComments() {
    this._store.dispatch(new ToggleShowAllCommentsAction());
  }

  openDialog(type: 'delete' | 'erase' | 'edit') {
    const dialogConfig: MatDialogConfig = {
      width: '560px',
      maxHeight: '80vh',
      position: {
        top: '112px',
      },
      data: { mode: `${type}Resource`, title: this.resource.res.label },
    };

    const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((answer: ConfirmationWithComment) => {
      if (!answer) {
        // if the user clicks outside of the dialog window, answer is undefined
        return;
      }
      if (answer.confirmed === true) {
        if (type !== 'edit') {
          const payload = new DeleteResource();
          payload.id = this.resource.res.id;
          payload.type = this.resource.res.type;
          payload.deleteComment = answer.comment ? answer.comment : undefined;
          payload.lastModificationDate = this.lastModificationDate;
          switch (type) {
            case 'delete':
              // delete the resource and refresh the view
              this._dspApiConnection.v2.res.deleteResource(payload).subscribe((response: DeleteResourceResponse) => {
                this._onResourceDeleted(response);
              });
              break;

            case 'erase':
              // erase the resource and refresh the view
              this._dspApiConnection.v2.res.eraseResource(payload).subscribe((response: DeleteResourceResponse) => {
                this._onResourceDeleted(response);
              });
              break;
          }
        } else if (this.resource.res.label !== answer.comment) {
          // update resource's label if it has changed
          // get the correct lastModificationDate from the resource
          this._dspApiConnection.v2.res.getResource(this.resource.res.id).subscribe((res: ReadResource) => {
            const payload = new UpdateResourceMetadata();
            payload.id = this.resource.res.id;
            payload.type = this.resource.res.type;
            payload.lastModificationDate = res.lastModificationDate;
            payload.label = answer.comment;

            this._dspApiConnection.v2.res
              .updateResourceMetadata(payload)
              .subscribe((response: UpdateResourceMetadataResponse) => {
                this.resource.res.label = payload.label;
                this.lastModificationDate = response.lastModificationDate;
                // if annotations tab is active; a label of a region has been changed --> update regions
                this._componentCommsService.emit(new EmitEvent(CommsEvents.resourceChanged));
                if (this.isAnnotation) {
                  this.regionChanged.emit();
                }
                this._cd.markForCheck();
              });
          });
        }
      }
    });
  }

  /**
   * display message to confirm the copy of the citation link (ARK URL)
   */
  openSnackBar(message: string) {
    this._notification.openSnackBar(message);
  }

  private _onResourceDeleted(response: DeleteResourceResponse) {
    // display notification and mark resource as 'erased'
    this._notification.openSnackBar(`${response.result}: ${this.resource.res.label}`);
    const ontologyIri = this._ontologyService.getOntologyIriFromRoute(this.attachedProject.shortcode);
    const classId = this.resource.res.entityInfo.classes[this.resource.res.type]?.id;
    this._store.dispatch(new LoadClassItemsCountAction(ontologyIri, classId));
    this._componentCommsService.emit(new EmitEvent(CommsEvents.resourceDeleted));
    // if it is an Annotation/Region which has been erases, we emit the
    // regionChanged event, in order to refresh the page
    this.regionDeleted.emit();

    this._cd.markForCheck();
  }
}
