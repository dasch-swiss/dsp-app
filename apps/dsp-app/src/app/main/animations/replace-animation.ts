import { animate, style, transition, trigger } from '@angular/animations';

export class ReplaceAnimation {
  public static enterTime = 500;
  public static liveTime = 0;

  public static animation = trigger('replaceAnimation', [
    transition(':enter', [style({ opacity: 0 }), animate(ReplaceAnimation.enterTime, style({ opacity: 1 }))]),
    transition(':leave', [style({ opacity: 1 }), animate(ReplaceAnimation.liveTime, style({ opacity: 0 }))]),
  ]);
}
