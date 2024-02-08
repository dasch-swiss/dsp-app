export class ProjectImageSettings {
  aspect: boolean = false;
  absoluteWidth: number = 0;
  percentage: number = 0;

  /*
    !d,d The returned image is scaled so that the width and height of the returned image are not greater than d, while maintaining the aspect ratio.
    pct:n The width and height of the returned image is scaled to n percent of the width and height of the extracted region. 1<= n <= 100.
  */
  static GetProjectImageSettings(size?: string): ProjectImageSettings {
    if (!size) {
      return <ProjectImageSettings>{};
    }

    const isPercentage = size.startsWith('pct');
    return <ProjectImageSettings>{
      aspect: isPercentage,
      absoluteWidth: !isPercentage ? size.substring(1).split(',').pop() : 0,
      percentage: isPercentage ? size.split('pct:').pop() : 0,
    };
  }

  static FormatToIiifSize(aspect: any, percentage: any, width: number): string {
    return aspect ? `pct:${percentage}` : `!${width},${width}`;
  }
}
