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
import {
  ApiResponseError,
  CreateChildNodeRequest,
  KnoraApiConnection,
  List,
  ListNodeInfo,
  StringLiteral,
  UpdateChildNodeRequest,
} from '@dasch-swiss/dsp-js';
import { ListApiService } from '@dasch-swiss/vre/shared/app-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-edit-list-item',
  templateUrl: './edit-list-item.component.html',
  styleUrls: ['./edit-list-item.component.scss'],
})
export class EditListItemComponent implements OnInit {
  @Input() iri: string;

  @Input() mode: 'insert' | 'update';

  @Input() parentIri?: string;

  @Input() position?: number;

  @Input() projectIri: string;

  @Output() closeDialog: EventEmitter<List | ListNodeInfo> = new EventEmitter<List>();

  loading: boolean;

  // the list node being edited
  listNode: ListNodeInfo;

  // local arrays to use when updating the list node
  labels: StringLiteral[];
  comments: StringLiteral[];

  // used to check if request to delete comments should be sent
  initialCommentsLength: number;

  /**
   * error checking on the following fields
   */
  formErrors = {
    label: {
      required: 'A label is required.',
    },
  };

  /**
   * in case of an API error
   */
  errorMessage: any;

  saveButtonDisabled = false;

  formInvalidMessage: string;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _listApiService: ListApiService,
    private _errorHandler: AppErrorHandler,
    private _projectService: ProjectService,
    private _cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;

    // if updating a node, get the existing node info
    if (this.mode === 'update') {
      this._listApiService.getNodeInfo(this.iri).subscribe(response => {
        this.loading = false;
        this.listNode = response.nodeinfo;
        this.buildForm(response.nodeinfo);
        this._cd.markForCheck();
      });
    } else {
      this.labels = [];
      this.comments = [];

      this.loading = false;
    }
  }

  /**
   * separates the labels and comments of a list node into two local arrays.
   *
   * @param listNode info about a list node
   */
  buildForm(listNode: ListNodeInfo): void {
    this.labels = [];
    this.comments = [];

    if (listNode && listNode.id) {
      this.labels = listNode.labels;
      this.comments = listNode.comments;
      this.initialCommentsLength = this.comments.length;
    }

    this.loading = false;
  }

  /**
   * called from the template any time the labels or comments are changed to update the local arrays.
   * At least one label is required. Otherwise, the 'update' button will be disabled.
   *
   * @param data the data that was changed
   * @param type the type of data that was changed
   */
  handleData(data: StringLiteral[], type: string) {
    switch (type) {
      case 'labels':
        this.labels = data;
        break;

      case 'comments':
        this.comments = data;
        break;
    }

    if (this.labels.length === 0) {
      // invalid form, don't let user submit
      this.saveButtonDisabled = true;
      this.formInvalidMessage = this.formErrors.label.required;
    } else {
      this.saveButtonDisabled = false;
      this.formInvalidMessage = null;
    }
  }

  /**
   * called from the template when the 'submit' button is clicked in update mode.
   * sends a request to DSP-API to update the list child node with the data inside the two local arrays.
   */
  updateChildNode() {
    const childNodeUpdateData: UpdateChildNodeRequest = new UpdateChildNodeRequest();
    childNodeUpdateData.projectIri = this.projectIri;
    childNodeUpdateData.listIri = this.iri;
    childNodeUpdateData.labels = this.labels;
    childNodeUpdateData.comments = this.comments.length > 0 ? this.comments : undefined;

    this._listApiService.updateChildNode(childNodeUpdateData.listIri, childNodeUpdateData).subscribe(
      response => {
        // if initialCommentsLength is not equal to 0 and the comment is now empty, send request to delete comment
        if (this.initialCommentsLength !== 0 && !childNodeUpdateData.comments) {
          this._listApiService.deleteChildComments(childNodeUpdateData.listIri).subscribe();
        }
        this.loading = false;
        this.closeDialog.emit(response.nodeinfo);
      },
      (error: ApiResponseError) => {
        this.errorMessage = error;
        this.loading = false;
      }
    );
  }

  /**
   * called from the template when the 'submit' button is clicked in insert mode.
   * Sends a request to DSP-API to insert a new list child node in the provided position.
   */
  insertChildNode() {
    const createChildNodeRequest: CreateChildNodeRequest = new CreateChildNodeRequest();
    createChildNodeRequest.name = `${this._projectService.iriToUuid(this.projectIri)}-${Math.random()
      .toString(36)
      .substring(2)}${Math.random().toString(36).substring(2)}`;
    createChildNodeRequest.parentNodeIri = this.parentIri;
    createChildNodeRequest.labels = this.labels;
    createChildNodeRequest.comments = this.comments.length > 0 ? this.comments : undefined;
    createChildNodeRequest.projectIri = this.projectIri;
    createChildNodeRequest.position = this.position;

    this._listApiService.createChildNode(createChildNodeRequest.parentNodeIri, createChildNodeRequest).subscribe(
      response => {
        this.loading = false;
        this.closeDialog.emit(response.nodeinfo);
      },
      (error: ApiResponseError) => {
        this.errorMessage = error;
        this.loading = false;
      }
    );
  }
}
