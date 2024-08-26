import { Segment } from './segment';

export class SegmentOrdering {
  static createSegment(segmentsToOrder: Segment[]): Segment[] {
    if (segmentsToOrder.length === 0) {
      return [];
    }

    return this.createSegmentRecursive(segmentsToOrder, 0, 0)!;
  }

  static createSegmentRecursive(segmentsToOrder: Segment[], fromStart: number, row: number): Segment[] | null {
    const segments = this.orderByStartAndLength(segmentsToOrder.filter(v => v.hasSegmentBounds.start >= fromStart));
    if (segments.length > 0) {
      const firstSegment = segments[0];
      return [
        { ...firstSegment, row },
        ...(this.createSegmentRecursive(
          segmentsToOrder.filter(v => v !== firstSegment),
          firstSegment.hasSegmentBounds.end,
          row
        ) ?? []),
      ];
    }

    if (segmentsToOrder.length > 0) {
      return this.createSegmentRecursive(segmentsToOrder, 0, row + 1);
    }

    return null;
  }

  /**
   * Order segments by first their starting point, and if equal the longest first
   */
  private static orderByStartAndLength(segments: Segment[]) {
    return segments.sort((a, b) => {
      if (a.hasSegmentBounds.start === b.hasSegmentBounds.start) {
        return b.hasSegmentBounds.end - b.hasSegmentBounds.start - (a.hasSegmentBounds.end - a.hasSegmentBounds.start);
      }
      return a.hasSegmentBounds.start - b.hasSegmentBounds.start;
    });
  }
}
