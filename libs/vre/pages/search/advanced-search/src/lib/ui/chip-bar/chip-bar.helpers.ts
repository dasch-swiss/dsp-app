import { ConnectionPositionPair } from '@angular/cdk/overlay';
import { StatementElement } from '../../model';

export const OPEN_CHIP_NONE = null;
export type OpenChipId = string | typeof OPEN_CHIP_NONE;

export const CHIP_POPOVER_POSITIONS: ConnectionPositionPair[] = [
  new ConnectionPositionPair({ originX: 'start', originY: 'bottom' }, { overlayX: 'start', overlayY: 'top' }, 0, 4),
];

export function cloneStatementElement(source: StatementElement): StatementElement {
  const clone = new StatementElement(source.subjectNode, source.statementLevel);
  if (source.selectedPredicate) clone.selectedPredicate = source.selectedPredicate;
  if (source.selectedOperator) clone.selectedOperator = source.selectedOperator;
  if (source.selectedObjectValue !== undefined) {
    clone.selectedObjectValue = source.selectedObjectValue;
  }
  return clone;
}
