const BEOL_PROJECT_ID = 'yTerZGyxjZVqFMNNKXCDPF';
const BEOL_PROJECT_SHORTCODE = '0801';
export const BEOL = {
  id: BEOL_PROJECT_ID,
  shortcode: BEOL_PROJECT_SHORTCODE,
};

export const LOGIN_DATA = {
  username: __ENV.DSP_APP_USERNAME,
  password: __ENV.DSP_APP_PASSWORD,
  fullname: __ENV.DSP_APP_FULLNAME,
};

export const ENVIRONMENTS = {
  DEV: 'https://app.dev.dasch.swiss',
  DEV02: 'https://app.dev-02.dasch.swiss',
  STAGE: 'https://app.stage.dasch.swiss',
  PROD: 'https://app.dasch.swiss'
};
