export class ProjectImageSettings {
  static AbsoluteWidthSteps: number[] = [64, 128, 256, 512, 1024];

  restrictImageSize = false;
  isWatermark: boolean = false;
  aspect: boolean = false;
  absoluteWidth: number = ProjectImageSettings.AbsoluteWidthSteps[0];
  percentage: number = 1;

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
      restrictImageSize: !(isPercentage && size.split('pct:').pop() === '100'),
      isWatermark: true,
      aspect: isPercentage,
      absoluteWidth: !isPercentage ? size.substring(1).split(',').pop() : ProjectImageSettings.AbsoluteWidthSteps[0],
      percentage: isPercentage ? size.split('pct:').pop() : 1,
    };
  }

  static FormatToIiifSize(restrictImageSize: boolean, aspect: boolean, percentage: number, width: number): string {
    if (!restrictImageSize) {
      return 'pct:100';
    }

    return aspect ? `pct:${percentage}` : `!${width},${width}`;
  }
}
