# Project Cover Images

This directory contains cover images displayed on DSP project pages.

## Format Requirements

- **Format**: WebP
- **Width**: 500px (height scales proportionally)
- **Filename**: `{shortcode}.webp` where shortcode is the 4-character hex project shortcode (e.g., `0863.webp`)
- **Location**: `width-500/` subdirectory

## Adding or Updating Images

Use the `/format-project-image` Claude skill. It handles resizing, format conversion, optimization, and optional caption registration in a single step.

## License Captions

Some project images have attribution/copyright captions displayed below the cover image. These are stored in:

```
libs/vre/pages/project/project/src/lib/description/license-captions-mapping.ts
```

The file exports a `LicenseCaptionsMapping` Map keyed by project shortcode. Entries are sorted by shortcode in ascending order.
