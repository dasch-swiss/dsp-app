// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: 'cypress/**/**/**/*.cy.ts',
    excludeSpecPattern: ['*.spec.js', '*.spec.ts'],
    baseUrl: 'http://localhost:4200',
    env: {
      apiUrl: 'http://0.0.0.0:3333',
    },
  },
});
