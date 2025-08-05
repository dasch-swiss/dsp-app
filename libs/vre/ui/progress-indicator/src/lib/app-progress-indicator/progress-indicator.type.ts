export const SIZE_TO_PXL = {
  xsmall: 24,
  small: 48,
  medium: 64,
  large: 96,
} as const;

export type ProgressSize = keyof typeof SIZE_TO_PXL;
