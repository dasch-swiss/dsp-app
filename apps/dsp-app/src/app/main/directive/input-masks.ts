import { IMask } from 'angular-imask';

export class InputMasks {
  public static minMaxInputMask(min: number, max: number) {
    return {
      mask: IMask.MaskedNumber,
      min,
      max,
      autofix: true,
    };
  }
}
