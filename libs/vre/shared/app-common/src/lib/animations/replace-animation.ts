import { animate, style, transition, trigger } from '@angular/animations';

export class ReplaceAnimation {
  public static liveTime = 0;

  private static createAnimation(enterTime: number) {
    return trigger('replaceAnimation', [
      transition(':enter', [style({ opacity: 0 }), animate(enterTime, style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate(ReplaceAnimation.liveTime, style({ opacity: 0 }))]),
    ]);
  }

  public static animation = ReplaceAnimation.createAnimation(500);
  public static animationLong = ReplaceAnimation.createAnimation(1000);
}
