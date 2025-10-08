/* eslint-disable */
export default {
  displayName: 'jdnconvertiblecalendar',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: undefined,
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
};
