import { VectorViewerService, ViewerState } from './vector-viewer.service';

describe('VectorViewerService', () => {
  let service: VectorViewerService;
  let emittedStates: ViewerState[];

  beforeEach(() => {
    service = new VectorViewerService();
    emittedStates = [];
    service.state$.subscribe(state => emittedStates.push(state));
  });

  describe('initial state', () => {
    it('should have scale 1 and no translation', () => {
      expect(emittedStates[0]).toEqual({
        scale: 1,
        translateX: 0,
        translateY: 0,
      });
    });
  });

  describe('zoom', () => {
    it('should zoom in by factor of 1.2', () => {
      service.zoom(1);

      expect(emittedStates[1].scale).toBeCloseTo(1.2);
    });

    it('should zoom out by factor of 0.8', () => {
      service.zoom(-1);

      expect(emittedStates[1].scale).toBeCloseTo(0.8);
    });

    it('should not exceed max scale of 50', () => {
      for (let i = 0; i < 100; i++) {
        service.zoom(1);
      }

      const lastState = emittedStates[emittedStates.length - 1];
      expect(lastState.scale).toBeLessThanOrEqual(50);
    });

    it('should not go below min scale of 0.1', () => {
      for (let i = 0; i < 100; i++) {
        service.zoom(-1);
      }

      const lastState = emittedStates[emittedStates.length - 1];
      expect(lastState.scale).toBeGreaterThanOrEqual(0.1);
    });

    it('should adjust translation when zooming towards a point', () => {
      service.zoom(1, 100, 50);

      const state = emittedStates[1];
      expect(state.translateX).not.toBe(0);
      expect(state.translateY).not.toBe(0);
    });
  });

  describe('goHome', () => {
    it('should reset to initial state', () => {
      service.zoom(1);
      service.setPosition(100, 200);
      service.goHome();

      const lastState = emittedStates[emittedStates.length - 1];
      expect(lastState).toEqual({
        scale: 1,
        translateX: 0,
        translateY: 0,
      });
    });
  });

  describe('setPosition', () => {
    it('should update translation', () => {
      service.setPosition(150, -75);

      const lastState = emittedStates[emittedStates.length - 1];
      expect(lastState.translateX).toBe(150);
      expect(lastState.translateY).toBe(-75);
    });

    it('should expose translateX and translateY getters', () => {
      service.setPosition(50, 100);

      expect(service.translateX).toBe(50);
      expect(service.translateY).toBe(100);
    });
  });
});
