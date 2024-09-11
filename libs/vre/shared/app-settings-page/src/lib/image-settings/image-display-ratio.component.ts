import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-image-display-ratio',
  template: ` <div class="frame">
    <div [ngStyle]="{ width: ratio * 300 + 'px', height: ratio * 200 + 'px' }" class="back-rectangle">
      <div class="arrow left-arrow"></div>
      <div class="arrow right-arrow"></div>
      <div class="helper">Ratio: {{ Math.ceil(ratio * 100) }}%</div>
    </div>
  </div>`,
  styles: [
    `
      .frame {
        background: gray;
        width: 300px;
        height: 200px;
        position: relative;
      }

      .back-rectangle {
        background: darkgray;
        bottom: 0;
        right: 0;
        position: absolute;
      }

      .helper {
        min-width: 100px;
        position: absolute;
        bottom: -30px;
        right: 0;
        text-align: center;
        width: 100%;
      }

      .arrow {
        position: absolute;
        height: 1px; /* Adjust the height of the stick */
        background-color: red; /* Adjust the color of the stick */
        right: 0;
        bottom: 0px;
        width: 119%;
        transform: rotate(33deg);
        transform-origin: bottom right;
      }

      .left-arrow::before,
      .right-arrow::before {
        content: '';
        position: absolute;
        top: -5px;
        width: 0;
        height: 0;
        border-top: 5px solid transparent; /* Adjust the height of the arrow */
        border-bottom: 5px solid transparent; /* Adjust the height of the arrow */
      }

      .left-arrow::before {
        right: 0;
        border-left: 10px solid red; /* Adjust the width and color of the arrow */
      }

      .right-arrow::before {
        left: 0;
        border-right: 10px solid red; /* Adjust the width and color of the arrow */
      }
    `,
  ],
})
export class ImageDisplayRatioComponent {
  @Input() ratio: number;
  protected readonly Math = Math;
}
