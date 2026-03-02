#!/usr/bin/env bash
#
# process-image.sh — Resize and convert an image to 500px-wide WebP
#                     for DSP project cover images.
#
# Usage: process-image.sh <input-image> <SHORTCODE> [quality]
#
#   input-image  Path to the source image (PNG, JPG, TIFF, etc.)
#   SHORTCODE    4-character hex project shortcode (e.g., 0863)
#   quality      WebP quality 1-100 (default: 80)

set -euo pipefail

# ── Args ────────────────────────────────────────────────────────────
INPUT="${1:?Usage: process-image.sh <input-image> <SHORTCODE> [quality]}"
SHORTCODE="${2:?Usage: process-image.sh <input-image> <SHORTCODE> [quality]}"
QUALITY="${3:-80}"

# ── Resolve repo root (script lives at .claude/skills/format-project-image/scripts/) ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

OUTPUT_DIR="$REPO_ROOT/apps/dsp-app/src/assets/images/project/width-500"
OUTPUT_FILE="$OUTPUT_DIR/${SHORTCODE}.webp"

# ── Validate ────────────────────────────────────────────────────────
if [[ ! -f "$INPUT" ]]; then
  echo "ERROR: Input file not found: $INPUT" >&2
  exit 1
fi

if [[ ! -d "$OUTPUT_DIR" ]]; then
  echo "ERROR: Output directory not found: $OUTPUT_DIR" >&2
  echo "Are you running this from the dsp-das repository?" >&2
  exit 1
fi

if [[ ! "$SHORTCODE" =~ ^[0-9A-Fa-f]{4}$ ]]; then
  echo "ERROR: Shortcode must be exactly 4 hex characters, got: $SHORTCODE" >&2
  exit 1
fi

if [[ -f "$OUTPUT_FILE" ]]; then
  echo "WARNING: Output file already exists: $OUTPUT_FILE" >&2
  echo "It will be overwritten." >&2
fi

# ── Cleanup trap ────────────────────────────────────────────────────
TMPFILE=""
cleanup() {
  [[ -n "$TMPFILE" && -f "$TMPFILE" ]] && rm -f "$TMPFILE"
}
trap cleanup EXIT

# ── Process ─────────────────────────────────────────────────────────
if command -v cwebp &>/dev/null; then
  echo "Using cwebp + sips for conversion..."

  # Resize with sips (macOS built-in) to a temp file
  TMPFILE="$(mktemp /tmp/project-image-XXXXXX.png)"
  cp "$INPUT" "$TMPFILE"
  sips --resampleWidth 500 "$TMPFILE" --out "$TMPFILE" &>/dev/null

  # Convert to WebP
  cwebp -q "$QUALITY" "$TMPFILE" -o "$OUTPUT_FILE" 2>/dev/null

elif command -v magick &>/dev/null; then
  echo "Using ImageMagick for conversion..."

  # Single-step resize + convert
  magick "$INPUT" -resize 500x -quality "$QUALITY" "$OUTPUT_FILE"

else
  echo "ERROR: No suitable image tool found." >&2
  echo "Install one of the following:" >&2
  echo "  brew install webp        (recommended — provides cwebp)" >&2
  echo "  brew install imagemagick  (provides magick)" >&2
  exit 1
fi

# ── Report ──────────────────────────────────────────────────────────
if [[ -f "$OUTPUT_FILE" ]]; then
  SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
  SIZE_KB=$(( SIZE / 1024 ))
  echo ""
  echo "Done! Output: $OUTPUT_FILE"
  echo "File size: ${SIZE_KB} KB (${SIZE} bytes)"
else
  echo "ERROR: Output file was not created." >&2
  exit 1
fi
