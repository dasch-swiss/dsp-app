# format-project-image

Format and add a project cover image to the DSP-APP.

invocable: user
allowed-tools: Bash, Read, Edit, Glob

## Overview

This skill processes a source image (any common format: PNG, JPG, TIFF, etc.) into the required format for DSP project cover images: a 500px-wide WebP file named by project shortcode.

## Inputs

Gather the following from the user's message. If any **required** input is missing, ask conversationally before proceeding.

| Input | Required | Description |
|---|---|---|
| **Image file path** | Yes | Absolute or relative path to the source image file |
| **Project shortcode** | Yes | 4-character hexadecimal string (e.g., `0863`, `084F`) |
| **License caption** | No | Attribution/copyright text to display below the project cover image |

## Validation

Before processing, validate:

1. **Image file exists** at the given path
2. **Shortcode is valid**: exactly 4 hex characters (`[0-9A-Fa-f]{4}`)
3. **Repository root**: confirm `apps/dsp-app/src/assets/images/project/width-500/` exists
4. **Existing file**: if `{shortcode}.webp` already exists in the target directory, warn the user and ask whether to overwrite

## Tool Check

Check for an image conversion tool:

```bash
which cwebp || which magick
```

- **Preferred**: `cwebp` (from `webp` package) + `sips` (macOS built-in for resizing)
- **Fallback**: `magick` (ImageMagick, handles resize + convert in one step)
- **Neither found**: Tell the user to install one: `brew install webp` (recommended) or `brew install imagemagick`

## Processing

Run the bundled processing script:

```bash
bash .claude/skills/format-project-image/scripts/process-image.sh <input-image> <SHORTCODE> [quality]
```

- Default quality is 80 (good balance of size and quality)
- The script outputs the file to `apps/dsp-app/src/assets/images/project/width-500/{SHORTCODE}.webp`

## Caption Update

If the user provided a **license caption**:

1. Open `libs/vre/pages/project/project/src/lib/description/license-captions-mapping.ts`
2. Add a new entry `['<SHORTCODE>', '<caption text>']` to the Map
3. **Maintain shortcode-sorted order** (entries are sorted by shortcode ascending)
4. Follow the existing formatting conventions in the file (single-line for short captions, template literal for multi-line)

If no caption was provided, skip this step.

## Report

After processing, report:
- Output file path
- Output file size
- Whether the caption was added/updated
- Remind the user to **review the image** and **commit the changes** when satisfied
