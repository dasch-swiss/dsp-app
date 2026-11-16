/** Styles the sections of the Data models 2 tab share: the head, the search, the table box, chips and the panel. */
export const RAIL_SECTION_STYLES = `
  @use '../../../../../../../../apps/dsp-app/src/styles/config' as *;

  :host {
    display: block;
    height: 100%;
  }

  .section {
    position: relative;
    box-sizing: border-box;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 24px;
  }

  .head {
    flex: none;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
  }

  .counts {
    font-size: 13px;
    color: $cool_gray_500;
  }

  .spacer {
    flex: 1;
  }

  .search {
    --mat-form-field-container-height: 36px;
    --mat-form-field-container-vertical-padding: 6px;
    width: 280px;
    font-size: 13px;
    background: white;

    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: $cool_gray_500;
    }
  }

  .table-box {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: white;
    border: 1px solid $cool_gray_200;
    border-radius: 10px;

    table {
      width: 100%;
    }
  }

  .mat-mdc-header-cell {
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $cool_gray_500;
    background: $cool_gray_50;
  }

  .mat-mdc-row {
    height: 46px;
    cursor: pointer;

    &:hover {
      background: $cool_gray_50;
    }

    &.selected {
      background: $primary_50;
    }
  }

  .mat-mdc-cell {
    font-size: 13px;
  }

  .number {
    text-align: right;
  }

  .labelled {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .swatch {
    flex: none;
    width: 12px;
    height: 12px;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }

  .texts {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .label {
    font-weight: 500;
  }

  .name {
    padding: 0;
    background: none;
    font-family: 'Roboto Mono', ui-monospace, monospace;
    font-size: 11px;
    color: $cool_gray_500;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  // A class as a chip: white, a slate border, its colour in a narrow tab at the left, as the Overview draws it.
  .chip {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    overflow: hidden;
    background: white;
    font-size: 11px;
    line-height: 16px;
    color: #1f2937;

    .tab {
      flex: none;
      width: 10px;
    }

    .chip-label {
      padding: 0 6px;
    }
  }

  .none,
  .empty {
    color: $cool_gray_400;
  }

  .empty {
    margin: 0;
    padding: 16px;
  }

  // The panel floats over the right of the section, as over the graph, and over the table's sticky header (z-index
  // 100) too.
  .panel {
    position: absolute;
    z-index: 101;
    top: 0;
    right: 0;
    bottom: 0;
    width: 440px;
    max-width: 50%;
  }
`;
