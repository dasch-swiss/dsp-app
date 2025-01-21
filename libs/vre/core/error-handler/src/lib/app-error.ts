export class AppError extends Error {
  constructor(message: string) {
    super(`DSP-APP Logic Error: ${message}`);
  }
}
