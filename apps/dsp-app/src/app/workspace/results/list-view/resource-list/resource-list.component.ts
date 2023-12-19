import { Component, EventEmitter, Input, OnInit, Output, ViewChildren } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { Constants, ReadLinkValue, ReadResource, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { ResourceService } from '../../../resource/services/resource.service';
import { CheckboxUpdate, FilteredResources } from '../list-view.component';
import { ListViewService } from '../list-view.service';

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
})
export class ResourceListComponent implements OnInit {
  /**
   * list of all resource checkboxes. This list is used to
   * unselect all checkboxes when single selection to view
   * resource is used
   */
  @ViewChildren('ckbox') resChecks: MatCheckbox[];

  /**
   * list of resources of type ReadResourceSequence
   *
   * @param  {ReadResourceSequence} resources
   */
  @Input() resources: ReadResourceSequence;

  /**
   * list of all selected resources indices
   */
  @Input() selectedResourceIdx: number[];

  /**
   * set to true if multiple resources can be selected for comparison
   */
  @Input() withMultipleSelection?: boolean = false;

  /**
   * click on checkbox will emit the resource info
   *
   * @param  {EventEmitter<FilteredResources>} resourcesSelected
   */
  @Output() resourcesSelected?: EventEmitter<FilteredResources> = new EventEmitter<FilteredResources>();

  constructor(
    private _listView: ListViewService,
    private _resourceService: ResourceService
  ) {}

  ngOnInit() {
    // select the first item in the list
    if (this.resources.resources.length) {
      this.selectResource({
        checked: true,
        resIndex: 0,
        resId: this.resources.resources[0].id,
        resLabel: this.resources.resources[0].label,
        isCheckbox: false,
      });
    }
  }

  /**
   * opens a clicked internal link
   * @param linkValue
   */
  openResource(linkValue: ReadLinkValue | string) {
    const iri = typeof linkValue == 'string' ? linkValue : linkValue.linkedResourceIri;
    const path = this._resourceService.getResourcePath(iri);
    window.open('/resource' + path, '_blank');
  }

  selectResource(status: CheckboxUpdate) {
    const selection: FilteredResources = this._listView.viewResource(
      status,
      this.withMultipleSelection,
      this.selectedResourceIdx,
      this.resChecks
    );

    this.selectedResourceIdx = selection.resListIndex;

    this.resourcesSelected.emit(selection);
  }

  /**
   * given a resource, return the corresponding mat-icon for the subclass
   *
   * @returns mat-icon name as string
   */
  getIcon(resource: ReadResource): string {
    const subclass = resource.entityInfo.classes[resource.type].subClassOf[0];

    switch (subclass) {
      case Constants.AudioRepresentation:
        return 'audio_file';
      case Constants.ArchiveRepresentation:
        return 'folder_zip';
      case Constants.DocumentRepresentation:
        return 'description';
      case Constants.MovingImageRepresentation:
        return 'video_file';
      case Constants.StillImageRepresentation:
        return 'image';
      case Constants.TextRepresentation:
        return 'text_snippet';
      default: // resource does not have a file representation
        return 'insert_drive_file';
    }
  }
}
