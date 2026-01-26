import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-resource-representation-container',
  host: {
    '[style.--height]': 'heightValue',
  },
  template: `
    <div class="representation-container center">
      <ng-content />
    </div>
  `,
  styles: [
    `
      .representation-container {
        height: var(--height);
        border-radius: 8px;
        overflow: hidden;
        background: rgb(41, 41, 41);
        color: white;
      }
    `,
  ],
})
export class ResourceRepresentationContainerComponent {
  @Input() height: 'auto' | 'small' | 'big' = 'big';

  get heightValue(): string {
    switch (this.height) {
      case 'auto':
        return 'auto';
      case 'small':
        return '200px';
      case 'big':
        return '900px';
      default:
        return '900px';
    }
  }
}
