/**
 * main DSP (DaSCH Service Platform) config
 */
export class DspConfig {
  constructor(
    public release: string,
    public environment: string,
    public production: boolean,
    public color: string
  ) {}
}
