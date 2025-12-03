import { Directive, ElementRef, OnInit } from '@angular/core';
import { MathJaxService } from './math-jax.service';

@Directive({
  selector: '[appMathjax]',
  standalone: false,
})
export class MathJaxDirective implements OnInit {
  constructor(
    private readonly _ele: ElementRef,
    private readonly _mathJaxService: MathJaxService
  ) {}

  ngOnInit() {
    if (MathJaxService.containsLatex(this._ele.nativeElement.innerHTML)) {
      this._mathJaxService.getMathJaxLoadedPromise().then(() => {
        this._mathJaxService.render(this._ele.nativeElement);
      });
    }
  }
}
