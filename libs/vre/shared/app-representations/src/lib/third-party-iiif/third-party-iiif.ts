export class IIIFUrl {
  private _url: URL;

  private readonly qualform_ex = /^(color|gray|bitonal|default)\.(jpg|tif|png|jp2)$/;
  private readonly rotation_ex = /^[-+]?[0-9]*\.?[0-9]+$|^![-+]?[0-9]*\.?[0-9]+$/;
  private readonly size_ex = /^(\^?max)|(\^?pct:[0-9]*\.?[0-9]*)|(\^?[0-9]*,)|(\^?,[0-9]*)|(\^?!?[0-9]*,[0-9]*)$/;
  private readonly region_ex =
    /^(full)|(square)|([0-9]+,[0-9]+,[0-9]+,[0-9]+)|(pct:[0-9]*\.?[0-9]*,[0-9]*\.?[0-9]*,[0-9]*\.?[0-9]*,[0-9]*\.?[0-9]*)$/;

  private constructor(url: string) {
    this._url = new URL(url);
  }

  static createUrl(url: string): IIIFUrl | null {
    try {
      return new IIIFUrl(url);
    } catch (error) {
      return null;
    }
  }

  private get _baseUrl(): string {
    return `${this._url.protocol}//${this._url.host}`;
  }

  private get _segments(): string[] {
    return this._url.pathname.split('/').slice(1);
  }

  private get _qualitySegment(): string {
    return this._segments[this._segments.length - 1];
  }

  private get _quality(): string {
    return this._qualitySegment.split('.')[0];
  }

  private get _rotationSegment(): string {
    return this._segments[this._segments.length - 2];
  }

  private get _sizeSegment(): string {
    return this._segments[this._segments.length - 3];
  }

  private get _regionSegment(): string {
    return this._segments[this._segments.length - 4];
  }

  get isValidIiifUrl(): boolean {
    if (this._segments.length < 5) {
      return false;
    }

    if (!this.qualform_ex.test(this._qualitySegment)) {
      return false;
    }

    if (!this.rotation_ex.test(this._rotationSegment)) {
      return false;
    }

    if (!this.size_ex.test(this._sizeSegment)) {
      return false;
    }

    if (!this.region_ex.test(this._regionSegment)) {
      return false;
    }

    return true;
  }

  get iiifImageInstanceUrl(): string {
    return `${this._baseUrl}/${this._segments.slice(0, this._segments.length - 4).join('/')}`;
  }

  get infoJsonUrl() {
    return `${this.iiifImageInstanceUrl}/info.json`;
  }

  get previewImageUrl() {
    return `${this.iiifImageInstanceUrl}/${this._regionSegment}/${this._sizeSegment}/${this._rotationSegment}/${this._quality}.jpg`;
  }
}
