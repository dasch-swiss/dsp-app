/**
 * Styles the Data models 2 tables share, as the Data tab's table: fixed, resizable and movable columns with borders, a
 * frozen first column, uppercase headers with filters, one line per row condensed, everything expanded. The toolbar's
 * "All languages" switch and density toggle too.
 */
export const TABLE_STYLES = `
  @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

  .all-languages {
    flex: none;
    margin-right: 12px;
    font-size: 13px;
  }

  .density {
    --mat-button-toggle-height: 36px;
    --mat-button-toggle-legacy-height: 36px;
    --mat-button-toggle-label-text-line-height: 34px;
    --mat-button-toggle-label-text-size: 13px;
    background: white;

    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
      vertical-align: -4px;
    }
  }

  table {
    table-layout: fixed;
  }

  // A fixed layout needs the table's own width: the sum of its columns, the whole box at least.
  .table-box table {
    min-width: 100%;
  }

  .mat-mdc-header-row {
    height: 48px;
  }

  .mat-mdc-header-cell {
    position: relative;
    padding: 4px 6px 4px 10px;
    background: #f9fafb;

    &.filtered {
      background: #e6edf3;
    }
  }

  // A header dragged sideways moves its column; the first column stays first.
  th.movable {
    cursor: grab;
  }

  .cdk-drag-preview {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 12px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
    cursor: grabbing;
  }

  .cdk-drag-placeholder {
    opacity: 0.35;
  }

  .cdk-drag-animating,
  .cdk-drop-list-dragging th.movable:not(.cdk-drag-placeholder) {
    transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
  }

  // The first column stays while the others scroll under it, in the row's own tint.
  .mat-mdc-cell.frozen {
    background: inherit;
  }

  .frozen {
    border-right: 1px solid $cool_gray_200;
  }

  .scrolled .frozen {
    box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.18);
  }

  // A filter's options, in its column header's menu.
  mat-radio-group {
    display: flex;
    flex-direction: column;
  }

  .filter-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .filter-all {
    height: 28px;
    padding: 0 8px;
    font-size: 13px;
  }

  .filter-heading {
    padding: 4px 0;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $cool_gray_500;
  }

  .contains {
    width: 240px;
    font-size: 13px;
  }

  .clear {
    align-self: flex-end;
    margin-top: 4px;
    padding: 6px 8px;
    border: 0;
    background: none;
    font: 500 13px var(--font-sans, Roboto, sans-serif);
    color: $primary;
    cursor: pointer;
  }

  .mat-mdc-cell {
    padding: 4px 10px;
  }

  .mat-mdc-header-cell,
  .mat-mdc-cell {
    border-right: 1px solid #e5e7eb;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:last-child {
      border-right: 0;
    }
  }

  .mat-mdc-row {
    height: 44px;
  }

  // Expanded, a row grows to show everything.
  table.expanded .mat-mdc-cell {
    padding-top: 10px;
    padding-bottom: 10px;
    vertical-align: top;
    white-space: normal;
  }
`;
