/* eslint-disable */
export default {
  displayName: 'jdnconvertiblecalendar',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: undefined,
  coverageDirectory: '../../coverage/libs/jdnconvertiblecalendar',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.d.ts', '!src/test-setup.ts', '!src/index.ts'],
};
