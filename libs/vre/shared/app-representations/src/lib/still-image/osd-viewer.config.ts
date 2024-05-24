export const osdViewerConfig = {
  sequenceMode: false,
  showReferenceStrip: true,
  zoomInButton: 'DSP_OSD_ZOOM_IN',
  zoomOutButton: 'DSP_OSD_ZOOM_OUT',
  previousButton: 'DSP_OSD_PREV_PAGE',
  nextButton: 'DSP_OSD_NEXT_PAGE',
  homeButton: 'DSP_OSD_HOME',
  fullPageButton: 'DSP_OSD_FULL_PAGE',
  // rotateLeftButton: 'DSP_OSD_ROTATE_LEFT',        // doesn't work yet
  // rotateRightButton: 'DSP_OSD_ROTATE_RIGHT',       // doesn't work yet
  showNavigator: true,
  navigatorPosition: 'ABSOLUTE' as const,
  navigatorTop: 'calc(100% - 136px)',
  navigatorLeft: 'calc(100% - 136px)',
  navigatorHeight: '120px',
  navigatorWidth: '120px',
  gestureSettingsMouse: {
    clickToZoom: false, // do not zoom in on click
    dblClickToZoom: true, // but zoom on double click
    flickEnabled: true, // perform a flick gesture to drag image
    animationTime: 0.1, // direct and instant drag performance
  },
  visibilityRatio: 1.0, // viewers focus limited to the image borders; no more cutting the image on zooming out
};
