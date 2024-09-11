import { Injectable } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { FilteredResources } from '@dasch-swiss/vre/shared/app-common-to-move';
import { CheckboxUpdate, ShortResInfo } from './list-view.component';

@Injectable({
  providedIn: 'root',
})
export class ListViewService {
  // for keeping track of multiple selection
  selectedResourcesCount = 0;
  selectedResourcesList: ShortResInfo[] = [];
  selectedResourceIdxMultiple = [];

  viewResource(
    status: CheckboxUpdate,
    withMultipleSelection: boolean,
    selectedResourceIdx: number[],
    resChecks: MatCheckbox[]
  ): FilteredResources {
    if (selectedResourceIdx.length === 1 && this.selectedResourcesCount === 0) {
      // reset the selected resources count and list
      // this.selectedResourcesCount = 0;
      this.selectedResourcesList = [];
      this.selectedResourceIdxMultiple = [];
    }

    const resInfo: ShortResInfo = {
      id: status.resId,
      label: status.resLabel,
    };

    // when multiple selection and checkbox is used to select more
    // than one resources
    if (withMultipleSelection && status.isCheckbox) {
      if (status.checked) {
        if (selectedResourceIdx.indexOf(status.resIndex) <= 0) {
          // add resource in to the selected resources list
          this.selectedResourcesList.push(resInfo);

          // increase the count of selected resources
          this.selectedResourcesCount += 1;

          // add resource list index to apply selected class style
          this.selectedResourceIdxMultiple.push(status.resIndex);
        }
      } else {
        // remove resource from the selected resources list
        let index = this.selectedResourcesList.findIndex(d => d.id === status.resId);
        this.selectedResourcesList.splice(index, 1);

        // decrease the count of selected resources
        this.selectedResourcesCount -= 1;

        // remove resource list index from the selected index list
        index = this.selectedResourceIdxMultiple.findIndex(d => d === status.resIndex);
        this.selectedResourceIdxMultiple.splice(index, 1);
      }
      // selectedResourceIdx = selectedResourceIdxMultiple;
      return {
        count: this.selectedResourcesCount,
        resListIndex: this.selectedResourceIdxMultiple,
        resInfo: this.selectedResourcesList,
        selectionType: 'multiple',
      };
    } else {
      // else condition when single resource is clicked for viewing
      // unselect checkboxes if any
      if (resChecks) {
        resChecks.forEach(ckb => {
          if (ckb.checked) {
            ckb.checked = false;
          }
        });
      }

      // reset all the variables for multiple selection
      this.selectedResourceIdxMultiple = [];
      this.selectedResourcesCount = 0;
      this.selectedResourcesList = [];

      // add resource list index to apply selected class style
      // selectedResourceIdx = [status.resListIndex];
      return {
        count: 1,
        resListIndex: [status.resIndex],
        resInfo: [resInfo],
        selectionType: 'single',
      };
    }
  }
}
