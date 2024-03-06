import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-image-display-absolute',
  template: ` <div class="frame">
    <div class="text">Example image with width: {{ bigWidth }}px</div>
    <div
      [ngStyle]="{ width: (widthPx / bigWidth) * 300 + 'px', height: (widthPx / bigWidth) * 200 + 'px' }"
      class="back-rectangle">
      <div class="arrow left-arrow"></div>
      <div class="arrow right-arrow"></div>
      <div class="helper">
        {{ widthPx }}
        px
      </div>
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

      .text {
        width: 100%;
        text-align: center;
        position: absolute;
        top: 20px;
      }

      .back-rectangle {
        background: darkgray;
        bottom: 0;
        right: 0;
        position: absolute;
      }

      .helper {
        position: absolute;
        bottom: -40px;
        right: 0;
        text-align: center;
        width: 100%;
        min-width: 100px;
      }

      .arrow {
        position: absolute;
        height: 1px; /* Adjust the height of the stick */
        background-color: red; /* Adjust the color of the stick */
        right: 0;
        bottom: -20px;
        width: 100%;
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
export class ImageDisplayAbsoluteComponent {
  @Input() widthPx: number;
  readonly bigWidth = 2048;
}
