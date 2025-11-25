import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { MultipleViewerService } from './multiple-viewer.service';

@Component({
  selector: 'app-resource-browser',
  template: `
    <as-split direction="horizontal">
      <as-split-area [size]="30">
        <app-resources-list [resources]="data.resources" [showBackToFormButton]="showBackToFormButton" />
      </as-split-area>
      <as-split-area [size]="70" cdkScrollable>
        <app-multiple-viewer />
      </as-split-area>
    </as-split>
  `,
  providers: [MultipleViewerService],
  standalone: false,
})
export class ResourceBrowserComponent implements OnInit, OnChanges {
  @Input({ required: true }) data!: { resources: ReadResource[]; selectFirstResource: boolean };
  @Input() showBackToFormButton = false;
  @Input() searchKeyword?: string;

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
