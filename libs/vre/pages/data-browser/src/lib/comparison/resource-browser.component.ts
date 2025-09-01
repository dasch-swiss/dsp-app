import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { Observable } from 'rxjs';
import { MultipleViewerService } from './multiple-viewer.service';

@Component({
  selector: 'app-resource-browser',
  template: ` <div class="whole-height">
    <as-split direction="horizontal">
      <as-split-area [size]="40">
        <app-resources-list [resources]="data.resources" [showBackToFormButton]="showBackToFormButton" />
      </as-split-area>
      <as-split-area [size]="60" cdkScrollable>
        <app-multiple-viewer />
      </as-split-area>
    </as-split>
  </div>`,
  styleUrls: ['./resource-browser.component.scss'],
  providers: [MultipleViewerService],
})
export class ResourceBrowserComponent implements OnInit, OnChanges {
  @Input({ required: true }) data!: { resources: ReadResource[]; selectFirstResource: boolean };
  @Input({ required: true }) hasRightsToShowCreateLinkObject$!: Observable<boolean>;
  @Input() showBackToFormButton = false;
  @Input() searchKeyword?: string;

  constructor(private _multipleViewerService: MultipleViewerService) {}

  ngOnInit() {
    this._multipleViewerService.searchKeyword = this.searchKeyword;
    this._multipleViewerService.onInit(this.hasRightsToShowCreateLinkObject$);
  }
  ngOnChanges() {
    if (!this._multipleViewerService.selectMode && this.data.selectFirstResource && this.data.resources.length > 0) {
      this._multipleViewerService.selectOneResource(this.data.resources[0]);
    }
  }
}
