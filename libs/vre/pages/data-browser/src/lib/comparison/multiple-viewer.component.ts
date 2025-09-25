import { Component } from '@angular/core';
import { map } from 'rxjs';
import { MultipleViewerService } from './multiple-viewer.service';

@Component({
  selector: 'app-multiple-viewer',
  template: `
    @if (selectedResourceIds$ | async; as selectedResourceIds) {
      @if (selectedResourceIds.length <= MAX_RESOURCES) {
        <app-comparison [resourceIds]="selectedResourceIds" />
      }
      @if (selectedResourceIds.length > MAX_RESOURCES) {
        <div class="centered">Too many resources are selected to be displayed.</div>
      }
      @if (selectedResourceIds.length === 0) {
        <div class="centered">Select a resource on the left panel to display.</div>
      }
    }
  `,
  styles: [
    `
      .centered {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
  standalone: false,
})
export class MultipleViewerComponent {
  readonly MAX_RESOURCES = 6;

  selectedResourceIds$ = this.multipleViewerService.selectedResources$.pipe(map(resources => resources.map(r => r.id)));

  constructor(public multipleViewerService: MultipleViewerService) {}
}
