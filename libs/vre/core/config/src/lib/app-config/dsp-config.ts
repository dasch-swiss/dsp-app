/**
 * main DSP (DaSCH Service Platform) config
 */
export class DspConfig {
  constructor(
    public readonly release: string,
    public readonly environment: string,
    public readonly production: boolean,
    public readonly color: string
  ) {}
}
