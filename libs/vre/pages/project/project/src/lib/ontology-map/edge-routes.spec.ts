import { bendFor } from './edge-routes';

describe('bendFor', () => {
  const source = { x: 0, y: 0 };
  const target = { x: 400, y: 0 };

  it('keeps a link straight when no box is in its way', () => {
    expect(bendFor(source, target, [{ x1: 150, y1: 40, x2: 250, y2: 80 }], 10).distance).toBe(0);
  });

  it('bends a link round a box in its way, to the side with room', () => {
    // Left of the line from the source is towards positive y here; the box sits mostly at negative y.
    expect(bendFor(source, target, [{ x1: 150, y1: -60, x2: 250, y2: 10 }], 10).distance).toBeGreaterThan(0);
  });

  it('peaks where the box is, so a box near one end needs no wide bend', () => {
    const nearTarget = bendFor(source, target, [{ x1: 300, y1: -10, x2: 340, y2: 20 }], 10);

    expect(nearTarget.weight).toBeGreaterThan(0.5);
    expect(Math.abs(nearTarget.distance)).toBeLessThan(120);
  });

  it('bends round several boxes in a row', () => {
    const boxes = [
      { x1: 100, y1: -20, x2: 160, y2: 20 },
      { x1: 240, y1: -20, x2: 300, y2: 20 },
    ];

    expect(Math.abs(bendFor(source, target, boxes, 10).distance)).toBeGreaterThan(0);
  });
});
