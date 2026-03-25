import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ViewerState {
  scale: number;
  translateX: number;
  translateY: number;
}

@Injectable()
export class VectorViewerService {
  private readonly _ZOOM_FACTOR = 0.2;
  private readonly _MIN_SCALE = 0.1;
  private readonly _MAX_SCALE = 50;

  private _scale = 1;
  private _translateX = 0;
  private _translateY = 0;

  private readonly _stateSubject = new BehaviorSubject<ViewerState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  state$ = this._stateSubject.asObservable();

  get translateX(): number {
    return this._translateX;
  }

  get translateY(): number {
    return this._translateY;
  }

  /**
   * Zoom in or out by a factor
   * @param direction 1 for zoom in, -1 for zoom out
   * @param centerX Optional x coordinate to zoom towards (in container coordinates)
   * @param centerY Optional y coordinate to zoom towards (in container coordinates)
   */
  zoom(direction: 1 | -1, centerX?: number, centerY?: number): void {
    const factor = 1 + direction * this._ZOOM_FACTOR;
    const newScale = Math.max(this._MIN_SCALE, Math.min(this._MAX_SCALE, this._scale * factor));

    if (centerX !== undefined && centerY !== undefined) {
      // Zoom towards the specified point
      const scaleChange = newScale / this._scale;
      this._translateX = centerX - (centerX - this._translateX) * scaleChange;
      this._translateY = centerY - (centerY - this._translateY) * scaleChange;
    }

    this._scale = newScale;
    this._emitState();
  }

  goHome(): void {
    this._scale = 1;
    this._translateX = 0;
    this._translateY = 0;
    this._emitState();
  }

  setPosition(x: number, y: number): void {
    this._translateX = x;
    this._translateY = y;
    this._emitState();
  }

  private _emitState(): void {
    this._stateSubject.next({
      scale: this._scale,
      translateX: this._translateX,
      translateY: this._translateY,
    });
  }
}
