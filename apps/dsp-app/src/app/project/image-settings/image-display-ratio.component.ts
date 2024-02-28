import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-image-display-ratio',
  template: `
    <div class="frame">
      <div
        [ngStyle]="{
          width: ratio * 330 + 'px',
          height: ratio * 390 + 'px'
        }"
        [style.filter]="!isWatermark ? 'blur(' + Math.ceil((1 - ratio) * 4) + 'px)' : null"
        class="back-rectangle"></div>
      <div class="helper">Ratio: {{ Math.ceil(ratio * 100) }}%</div>
      <div class="watermark" *ngIf="isWatermark"></div>
    </div>
  `,
  styles: [
    `
      .frame {
        background: gray;
        width: 330px;
        height: 390px;
        position: relative;
      }

      .back-rectangle {
        background: no-repeat center/100% url('../../../assets/images/image-settings.jpg');
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

      .watermark {
        position: absolute;
        top: 0;
        background: no-repeat center/100% url('../../../assets/images/image-settings-watermark.png');
        background-repeat: repeat-y;
        opacity: 0.5;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class ImageDisplayRatioComponent {
  @Input() ratio: number;
  @Input() isWatermark: boolean = false;
  protected readonly Math = Math;
}
