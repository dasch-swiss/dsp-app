import { ConnectionPositionPair } from '@angular/cdk/overlay';

export const OPEN_CHIP_NONE = null;
export type OpenChipId = string | typeof OPEN_CHIP_NONE;

export const CHIP_POPOVER_POSITIONS: ConnectionPositionPair[] = [
  new ConnectionPositionPair({ originX: 'start', originY: 'bottom' }, { overlayX: 'start', overlayY: 'top' }, 0, 4),
];
