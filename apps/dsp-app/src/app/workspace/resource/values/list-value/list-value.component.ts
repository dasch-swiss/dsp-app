import { ChangeDetectorRef, Component, Inject, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import {
  ApiResponseError,
  CreateListValue,
  KnoraApiConnection,
  ListNodeV2,
  ReadListValue,
  ResourcePropertyDefinition,
  UpdateListValue,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { BaseValueDirective } from '../../../../main/directive/base-value.directive';

@Component({
  selector: 'app-list-value',
  templateUrl: './list-value.component.html',
  styleUrls: ['./list-value.component.scss'],
})
export class ListValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {
  @Input() displayValue?: ReadListValue;
  @Input() propertyDef: ResourcePropertyDefinition;
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  listRootNode: ListNodeV2;
  // active node
  selectedNode: ListNodeV2;

  customValidators = [];

  selectedNodeHierarchy: string[] = [];

  constructor(
    @Inject(FormBuilder) protected _fb: FormBuilder,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _errorHandler: AppErrorHandler,
    private _cd: ChangeDetectorRef
  ) {
    super();
  }

  getInitValue(): string | null {
    if (this.displayValue !== undefined) {
      this.getReadModeValue(this.displayValue.listNode);
      return this.displayValue.listNode;
    } else {
      return null;
    }
  }

  // override the resetFormControl() from the base component to deal with appending root nodes.
  resetFormControl(): void {
    super.resetFormControl();
    if (this.mode === 'update') {
      this.selectedNode = new ListNodeV2();
      this.selectedNode.label = this.displayValue.listNodeLabel;
    } else {
      this.selectedNode = null;
    }
    if (this.valueFormControl !== undefined) {
      if (this.mode !== 'read') {
        const rootNodeIris = this.propertyDef.guiAttributes;
        for (const rootNodeIri of rootNodeIris) {
          const trimmedRootNodeIRI = rootNodeIri.substring(7, rootNodeIri.length - 1);
          this._dspApiConnection.v2.list.getList(trimmedRootNodeIRI).subscribe(
            (response: ListNodeV2) => {
              this.listRootNode = response;
            },
            (error: ApiResponseError) => {
              this._errorHandler.showMessage(error);
            }
          );
        }
      } else {
        this.valueFormControl.setValue(this.displayValue.listNodeLabel);
      }
    }
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngOnChanges(): void {
    this.resetFormControl();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  getNewValue(): CreateListValue | false {
    if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
      return false;
    }

    const newListValue = new CreateListValue();
    newListValue.listNode = this.valueFormControl.value;

    if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
      newListValue.valueHasComment = this.commentFormControl.value;
    }

    return newListValue;
  }

  getUpdatedValue(): UpdateListValue | false {
    if (this.mode !== 'update' || !this.form.valid) {
      return false;
    }

    const updatedListValue = new UpdateListValue();

    updatedListValue.id = this.displayValue.id;
    if (this.selectedNode.id !== '') {
      updatedListValue.listNode = this.selectedNode.id;
    } else {
      updatedListValue.listNode = this.displayValue.listNode;
    }
    if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
      updatedListValue.valueHasComment = this.commentFormControl.value;
    }

    return updatedListValue;
  }

  getSelectedNode(item: ListNodeV2) {
    this.menuTrigger.closeMenu();
    this.valueFormControl.markAsDirty();
    this.selectedNode = item;
    this.valueFormControl.setValue(item.id);
  }

  getReadModeValue(nodeIri: string): void {
    const rootNodeIris = this.propertyDef.guiAttributes;
    for (const rootNodeIri of rootNodeIris) {
      const trimmedRootNodeIRI = rootNodeIri.substring(7, rootNodeIri.length - 1);
      this._dspApiConnection.v2.list.getList(trimmedRootNodeIRI).subscribe(
        (response: ListNodeV2) => {
          if (!response.children.length) {
            // this shouldn't happen since users cannot select the root node
            this.selectedNodeHierarchy.push(response.label);
          } else {
            this.selectedNodeHierarchy = this._getHierarchy(nodeIri, response.children);
          }
          this._cd.markForCheck();
        },
        (error: ApiResponseError) => {
          this._errorHandler.showMessage(error);
        }
      );
    }
  }

  _getHierarchy(selectedNodeIri: string, children: ListNodeV2[]): string[] {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.id !== selectedNodeIri) {
        if (node.children) {
          const path = this._getHierarchy(selectedNodeIri, node.children);

          if (path) {
            path.unshift(node.label);
            return path;
          }
        }
      } else {
        return [node.label];
      }
    }
  }
}
