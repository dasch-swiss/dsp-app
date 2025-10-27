import { Component } from '@angular/core';
import { map } from 'rxjs';
import { MultipleViewerService } from './multiple-viewer.service';

@Component({
  selector: 'app-multiple-viewer',
  template: `
    @if (selectedResourceIds$ | async; as selectedResourceIds) {
      @if (selectedResourceIds.length === 0) {
        <app-centered-box>
          <app-centered-message
            [icon]="'arrow_circle_left'"
            [title]="'pages.dataBrowser.multipleViewer.selectResource' | translate"
            [message]="'pages.dataBrowser.multipleViewer.chooseResources' | translate" />
        </app-centered-box>
      } @else {
        @if (multipleViewerService.selectMode) {
          <app-resource-list-selection />
        }
        @if (selectedResourceIds.length <= MAX_RESOURCES) {
          <app-comparison [resourceIds]="selectedResourceIds" />
        } @else {
          <app-centered-box>
            <app-centered-message
              [icon]="'warning'"
              [title]="'pages.dataBrowser.multipleViewer.tooManyResources' | translate"
              [message]="'pages.dataBrowser.multipleViewer.maxResources' | translate: { count: MAX_RESOURCES }" />
          </app-centered-box>
        }
      }
    }
  `,
  standalone: false,
})
export class MultipleViewerComponent {
  readonly MAX_RESOURCES = 6;

  selectedResourceIds$ = this.multipleViewerService.selectedResources$.pipe(map(resources => resources.map(r => r.id)));

  constructor(public readonly multipleViewerService: MultipleViewerService) {}
}
