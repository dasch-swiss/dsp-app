import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { AngularSplitModule } from 'angular-split';
import { ResourcesListComponent } from '../list-view/resources-list.component';
import { MultipleViewerComponent } from './multiple-viewer.component';
import { MultipleViewerService } from './multiple-viewer.service';

@Component({
  selector: 'app-resource-browser',
  template: `
    <as-split direction="horizontal">
      <as-split-area [size]="30">
        <app-resources-list
          [resources]="data.resources"
          [showBackToFormButton]="showBackToFormButton"
          [showProjectShortname]="showProjectShortname" />
      </as-split-area>
      <as-split-area [size]="70" cdkScrollable>
        <app-multiple-viewer />
      </as-split-area>
    </as-split>
  `,
  providers: [MultipleViewerService],
  imports: [AngularSplitModule, ResourcesListComponent, MultipleViewerComponent],
})
export class ResourceBrowserComponent implements OnInit, OnChanges {
  @Input({ required: true }) data!: { resources: ReadResource[]; selectFirstResource: boolean };
  @Input() showBackToFormButton = false;
  @Input() searchKeyword?: string;
  @Input() showProjectShortname = false;

  constructor(private readonly _multipleViewerService: MultipleViewerService) {}

  ngOnInit() {
    this._multipleViewerService.searchKeyword = this.searchKeyword;
  }
  ngOnChanges() {
    if (!this._multipleViewerService.selectMode && this.data.selectFirstResource && this.data.resources.length > 0) {
      this._multipleViewerService.selectOneResource(this.data.resources[0]);
    }
  }
}
